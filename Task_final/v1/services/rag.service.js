const fs = require('fs');
const path = require('path');
const { systemKnowledge, findAnswerFromKnowledge } = require('./system-knowledge');
const taskSuggestionHelper = require('./task-suggestion.helper');
const Diary = require('../../models/diary.model');

/**
 * RAG Service - Retrieval Augmented Generation
 * Mở rộng đầy đủ cho Knowledge Base và Personal Data (Tasks, Calendar, Diary)
 * KHÔNG sử dụng codebase search trong chat pipeline (chỉ dùng cho /rag/search endpoint)
 */
class RAGService {
  constructor() {
    this.codebaseIndex = new Map(); // Store code chunks with metadata (chỉ dùng cho /rag/search)
    this.knowledgeIndex = []; // Knowledge RAG index cho user guides và FAQ
    this.vectorStore = []; // Simple vector store (có thể nâng cấp lên FAISS)
    this.initialized = false;
    this.knowledgeInitialized = false;
  }

  /**
   * Initialize RAG system - Index codebase (chỉ dùng cho /rag/search)
   */
  async initialize() {
    if (this.initialized) return;

    console.log('🔍 Initializing RAG system (codebase index for search only)...');
    const codebasePath = path.join(__dirname, '../../');
    
    // Index các file quan trọng (chỉ dùng cho endpoint search, không dùng trong chat)
    await this.indexDirectory(codebasePath, [
      'v1/controllers',
      'v1/models',
      'v1/routes',
      'v1/middlewares',
      'v2/controllers',
      'v2/models',
      'v2/routes',
    ]);

    this.initialized = true;
    console.log(`✅ Codebase index initialized with ${this.codebaseIndex.size} code chunks (for search endpoint only)`);
  }

  /**
   * Initialize Knowledge RAG index từ system-knowledge.js
   */
  async initializeKnowledgeIndex() {
    if (this.knowledgeInitialized) return;

    console.log('📚 Initializing Knowledge RAG index...');
    this.knowledgeIndex = [];

    // Index user guides
    for (const [category, guides] of Object.entries(systemKnowledge.userGuides)) {
      for (const [key, guide] of Object.entries(guides)) {
        if (guide.question && guide.answer) {
          // Tạo embedding từ question patterns + answer
          const textForEmbedding = [
            ...guide.question,
            guide.answer
          ].join(' ');

          this.knowledgeIndex.push({
            id: `${category}_${key}`,
            category,
            key,
            title: this.extractTitleFromAnswer(guide.answer),
            questionPatterns: guide.question,
            answer: guide.answer,
            embedding: this.simpleEmbedding(textForEmbedding),
            keywords: this.extractKeywordsFromText(textForEmbedding),
          });
        }
      }
    }

    // Index FAQ
    for (const category of Object.values(systemKnowledge.faq)) {
      if (Array.isArray(category)) {
        for (const item of category) {
          if (item.question && item.answer) {
            const textForEmbedding = [
              ...item.question,
              item.answer
            ].join(' ');

            this.knowledgeIndex.push({
              id: `faq_${this.knowledgeIndex.length}`,
              category: 'faq',
              key: 'general',
              title: this.extractTitleFromAnswer(item.answer),
              questionPatterns: item.question,
              answer: item.answer,
              embedding: this.simpleEmbedding(textForEmbedding),
              keywords: this.extractKeywordsFromText(textForEmbedding),
            });
          }
        }
      }
    }

    // Index overview
    if (systemKnowledge.overview) {
      const overviewText = [
        systemKnowledge.overview.name,
        systemKnowledge.overview.description,
        ...systemKnowledge.overview.features
      ].join(' ');

      this.knowledgeIndex.push({
        id: 'overview',
        category: 'overview',
        key: 'system_overview',
        title: systemKnowledge.overview.name,
        questionPatterns: ['hệ thống này làm gì', 'tính năng', 'features', 'chức năng', 'overview'],
        answer: `${systemKnowledge.overview.description}\n\n**Các tính năng chính:**\n${systemKnowledge.overview.features.map(f => `✅ ${f}`).join('\n')}`,
        embedding: this.simpleEmbedding(overviewText),
        keywords: this.extractKeywordsFromText(overviewText),
      });
    }

    this.knowledgeInitialized = true;
    console.log(`✅ Knowledge RAG index initialized with ${this.knowledgeIndex.length} knowledge items`);
  }

  /**
   * Extract title từ answer (lấy dòng đầu tiên hoặc phần đầu)
   */
  extractTitleFromAnswer(answer) {
    const lines = answer.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      // Lấy dòng đầu tiên, bỏ markdown formatting
      return lines[0].replace(/\*\*/g, '').replace(/^#+\s*/, '').substring(0, 100);
    }
    return 'Hướng dẫn';
  }

  /**
   * Extract keywords từ text (không phải code)
   */
  extractKeywordsFromText(text) {
    const keywords = new Set();
    const normalized = text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    // Lấy các từ quan trọng (loại bỏ stop words tiếng Việt đơn giản)
    const stopWords = new Set(['các', 'có', 'để', 'và', 'với', 'cho', 'của', 'trong', 'từ', 'về', 'theo', 'sau', 'khi', 'nếu', 'một', 'như', 'là', 'đã', 'được', 'bạn', 'hệ', 'thống']);
    
    normalized.forEach(word => {
      if (!stopWords.has(word) && word.length > 2) {
        keywords.add(word);
      }
    });

    return Array.from(keywords);
  }

  /**
   * Index một directory
   */
  async indexDirectory(basePath, directories) {
    for (const dir of directories) {
      const fullPath = path.join(basePath, dir);
      if (!fs.existsSync(fullPath)) continue;

      const files = this.getAllFiles(fullPath);
      for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.jsx')) {
          await this.indexFile(file, basePath);
        }
      }
    }
  }

  /**
   * Lấy tất cả files trong directory
   */
  getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        arrayOfFiles = this.getAllFiles(filePath, arrayOfFiles);
      } else {
        arrayOfFiles.push(filePath);
      }
    });

    return arrayOfFiles;
  }

  /**
   * Index một file code
   */
  async indexFile(filePath, basePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(basePath, filePath);

      // Chia code thành các chunks (functions, classes, etc.)
      const chunks = this.splitCodeIntoChunks(content, relativePath);

      chunks.forEach((chunk, index) => {
        const chunkId = `${relativePath}:${index}`;
        const embedding = this.simpleEmbedding(chunk.content); // Simple embedding

        this.codebaseIndex.set(chunkId, {
          id: chunkId,
          path: relativePath,
          content: chunk.content,
          type: chunk.type,
          name: chunk.name,
          embedding: embedding,
          keywords: this.extractKeywords(chunk.content),
        });
      });
    } catch (error) {
      console.error(`Error indexing file ${filePath}:`, error.message);
    }
  }

  /**
   * Chia code thành các chunks (functions, exports, etc.)
   */
  splitCodeIntoChunks(content, filePath) {
    const chunks = [];
    const lines = content.split('\n');

    let currentChunk = '';
    let currentType = 'code';
    let currentName = path.basename(filePath);
    let inFunction = false;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect function declarations
      if (line.match(/^(module\.exports\.|exports\.|const\s+\w+\s*=\s*(async\s+)?function|function\s+\w+|const\s+\w+\s*=\s*\(|class\s+\w+)/)) {
        if (currentChunk.trim()) {
          chunks.push({
            content: currentChunk.trim(),
            type: currentType,
            name: currentName,
          });
        }
        currentChunk = line + '\n';
        currentName = this.extractName(line);
        currentType = this.detectType(line);
        inFunction = true;
        braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      } else if (inFunction) {
        currentChunk += line + '\n';
        braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        if (braceCount === 0) {
          inFunction = false;
          chunks.push({
            content: currentChunk.trim(),
            type: currentType,
            name: currentName,
          });
          currentChunk = '';
        }
      } else {
        currentChunk += line + '\n';
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        type: currentType,
        name: currentName,
      });
    }

    return chunks.length > 0 ? chunks : [{ content, type: 'file', name: path.basename(filePath) }];
  }

  /**
   * Extract function/class name
   */
  extractName(line) {
    const match = line.match(/(?:module\.exports\.|exports\.|function\s+|const\s+\w+\s*=\s*(?:async\s+)?function\s+|class\s+)(\w+)/);
    return match ? match[1] : 'anonymous';
  }

  /**
   * Detect code type
   */
  detectType(line) {
    if (line.includes('module.exports') || line.includes('exports.')) return 'export';
    if (line.includes('function') || line.includes('=>')) return 'function';
    if (line.includes('class')) return 'class';
    if (line.includes('const') && line.includes('=')) return 'constant';
    return 'code';
  }

  /**
   * Simple embedding - TF-IDF based (có thể nâng cấp lên OpenAI embeddings)
   */
  simpleEmbedding(text) {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    return wordFreq;
  }

  /**
   * Extract keywords từ code
   */
  extractKeywords(content) {
    const keywords = new Set();
    
    // Extract function names, variables, API endpoints
    const patterns = [
      /(?:function|const|let|var)\s+(\w+)/g,
      /\/api\/v\d+\/\w+/g,
      /req\.(params|query|body)\.\w+/g,
      /module\.exports\.(\w+)/g,
    ];

    patterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) keywords.add(match[1].toLowerCase());
        if (match[0]) keywords.add(match[0].toLowerCase());
      }
    });

    return Array.from(keywords);
  }

  /**
   * Search codebase với query
   */
  async search(query, limit = 5) {
    if (!this.initialized) {
      await this.initialize();
    }

    const queryEmbedding = this.simpleEmbedding(query);
    const queryKeywords = this.extractKeywords(query);
    
    const results = [];

    // Tính similarity score
    for (const [id, chunk] of this.codebaseIndex.entries()) {
      const score = this.calculateSimilarity(queryEmbedding, queryKeywords, chunk);
      if (score > 0) {
        results.push({
          ...chunk,
          score,
        });
      }
    }

    // Sort by score và return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Tính similarity score cho codebase chunks
   */
  calculateSimilarity(queryEmbedding, queryKeywords, chunk) {
    let score = 0;

    // Keyword matching
    const chunkKeywords = chunk.keywords || [];
    const matchingKeywords = queryKeywords.filter(kw => 
      chunkKeywords.some(ck => ck.includes(kw) || kw.includes(ck))
    );
    score += matchingKeywords.length * 2;

    // TF-IDF similarity
    const queryWords = Object.keys(queryEmbedding);
    const chunkWords = Object.keys(chunk.embedding);
    
    const commonWords = queryWords.filter(w => chunkWords.includes(w));
    score += commonWords.length;

    // Path matching (bonus nếu query mention path)
    if (queryKeywords.some(kw => chunk.path.toLowerCase().includes(kw))) {
      score += 3;
    }

    // Type matching
    if (queryKeywords.some(kw => chunk.type.toLowerCase().includes(kw))) {
      score += 1;
    }

    return score;
  }

  /**
   * Tính cosine similarity giữa hai embeddings (cho knowledge docs)
   */
  calculateEmbeddingSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2) return 0;

    const keys1 = Object.keys(embedding1);
    const keys2 = Object.keys(embedding2);
    const commonKeys = keys1.filter(k => keys2.includes(k));

    if (commonKeys.length === 0) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    // Tính dot product và norms
    for (const key of keys1) {
      const val1 = embedding1[key] || 0;
      norm1 += val1 * val1;
      if (keys2.includes(key)) {
        const val2 = embedding2[key] || 0;
        dotProduct += val1 * val2;
      }
    }

    for (const key of keys2) {
      const val2 = embedding2[key] || 0;
      norm2 += val2 * val2;
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Detect intent của query
   */
  detectIntent(query) {
    const normalized = this.normalizeQuery(query);

    // 🔴 PRIORITY 0.5: Task Context Query - HỎI THÔNG TIN TASK CỤ THỂ (ưu tiên cao nhất)
    if (
      (normalized.includes('task') && (
        normalized.includes('nam trong du an nao') ||
        normalized.includes('thuoc du an nao') ||
        normalized.includes('du an nao') ||
        normalized.includes('co tai lieu') ||
        normalized.includes('tai lieu nao') ||
        normalized.includes('file dinh kem') ||
        normalized.includes('thong tin ve task') ||
        normalized.includes('chi tiet task') ||
        normalized.includes('lien quan den du an') ||
        normalized.includes('project nao')
      ))
    ) {
      return 'task_context';
    }

    // 🔴 PRIORITY 1: Personal Task - TẠO TASK (ƯTIÊN NHẤT vì cụ thể)
    if (
      normalized.includes('tao task') ||
      normalized.includes('tao cong viec') ||
      normalized.includes('them task') ||
      normalized.includes('them cong viec') ||
      normalized.includes('create task') ||
      normalized.includes('add task') ||
      normalized.includes('them nhiem vu')
    ) {
      return 'personal_task';
    }

    // 🔴 PRIORITY 1.5: Personal Task - CÁ NHÂN (kiểm tra "tôi", "của tôi", "mình")
    // CHECK TRƯỚC project_stats để tránh bị nhầm
    if (
      (normalized.includes('toi') || normalized.includes('minh') || normalized.includes('cua toi')) &&
      (normalized.includes('task') || normalized.includes('cong viec') || normalized.includes('viec'))
    ) {
      return 'personal_task';
    }

    // PRIORITY 2: Manager Analytics - CHECK TRƯỚC personal_task (dành cho MANAGER role)
    // Phân công, gợi ý công việc - ƯTIÊN CAO vì cụ thể hơn "gợi ý" chung chung
    if (
      normalized.includes('goi y phan cong') ||
      normalized.includes('phan cong') ||
      normalized.includes('phan chia') ||
      normalized.includes('phan bo') ||
      normalized.includes('gan task') ||
      normalized.includes('ai nen lam') ||
      normalized.includes('ai co thoi gian') ||
      normalized.includes('ai co khong') ||
      normalized.includes('can gan') ||
      normalized.includes('assign') ||
      normalized.includes('distribute') ||
      normalized.includes('suggestion')
    ) {
      return 'task_assignment';
    }

    // Liệt kê project members
    if (
      normalized.includes('ai trong team') ||
      normalized.includes('thanh vien') ||
      normalized.includes('co ai') ||
      normalized.includes('project members') ||
      normalized.includes('dung thi tham gia') ||
      normalized.includes('project nay co') ||
      normalized.includes('danh sach thanh vien du an') ||
      normalized.includes('ai lam cung')
    ) {
      return 'team_members';
    }

    // Thống kê, tiến độ, chậm trễ DỰ ÁN (không phải cá nhân)
    if (
      (normalized.includes('tien do') && normalized.includes('du an')) ||
      (normalized.includes('tien do') && normalized.includes('project')) ||
      normalized.includes('ai cham') ||
      normalized.includes('task cham') ||
      (normalized.includes('hoan thanh') && normalized.includes('du an')) ||
      (normalized.includes('hoan thanh') && normalized.includes('project')) ||
      normalized.includes('ti le hoan thanh') ||
      (normalized.includes('qua han') && !normalized.includes('toi')) ||
      normalized.includes('slow') ||
      (normalized.includes('progress') && normalized.includes('project')) ||
      normalized.includes('delay') ||
      (normalized.includes('overdue') && !normalized.includes('my')) ||
      normalized.includes('thong ke du an') ||
      normalized.includes('thong ke project')
    ) {
      return 'project_stats';
    }

    // PRIORITY 3: User Guide / FAQ
    if (
      normalized.includes('lam sao') ||
      normalized.includes('cach') ||
      normalized.includes('huong dan') ||
      normalized.includes('the nao') ||
      normalized.includes('dang ky') ||
      normalized.includes('dang nhap') ||
      normalized.includes('xem') && (normalized.includes('task') || normalized.includes('project') || normalized.includes('calendar')) ||
      normalized.includes('tinh nang') ||
      normalized.includes('features') ||
      normalized.includes('he thong nay lam gi')
    ) {
      return 'user_guide';
    }

    // PRIORITY 4: Personal Task (OTHER patterns) - CHỈ GỢI Ý TASK CÁ NHÂN
    if (
      normalized.includes('task') ||
      normalized.includes('cong viec') ||
      normalized.includes('viec') ||
      normalized.includes('nhiem vu') ||
      normalized.includes('hom nay') ||
      normalized.includes('ngay mai') ||
      normalized.includes('deadline') ||
      normalized.includes('uu tien') ||
      normalized.includes('ke hoach') ||
      normalized.includes('nhac nho') ||
      (normalized.includes('goi y') && !normalized.includes('phan cong'))  // Chỉ gợi ý task cá nhân, không phải gợi ý phân công
    ) {
      return 'personal_task';
    }

    // PRIORITY 5: Calendar / Events
    if (
      normalized.includes('lich') ||
      normalized.includes('calendar') ||
      normalized.includes('su kien') ||
      normalized.includes('event') ||
      normalized.includes('meeting') ||
      normalized.includes('cuoc hop')
    ) {
      return 'calendar';
    }

    // PRIORITY 6: Reports / Statistics (báo cáo cá nhân)
    if (
      normalized.includes('bao cao') ||
      normalized.includes('thong ke') ||
      normalized.includes('reports') ||
      normalized.includes('statistics') ||
      normalized.includes('dashboard')
    ) {
      return 'reports';
    }

    // PRIORITY 7: General / Overview
    if (
      normalized.includes('he thong') ||
      normalized.includes('system') ||
      normalized.includes('tinh nang') ||
      normalized.includes('features') ||
      normalized.includes('chuc nang')
    ) {
      return 'general';
    }

    return 'unknown';
  }

  /**
   * Normalize query để detect intent
   */
  normalizeQuery(query) {
    return query
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Retrieve knowledge documents dựa trên query (RAG retrieval)
   */
  async retrieveKnowledge(query, limit = 3) {
    if (!this.knowledgeInitialized) {
      await this.initializeKnowledgeIndex();
    }

    const queryEmbedding = this.simpleEmbedding(query);
    const queryKeywords = this.extractKeywordsFromText(query);
    const normalizedQuery = this.normalizeQuery(query);

    // Nhận diện câu hỏi về hệ thống tổng quan
    const isSystemOverviewQuery = 
      normalizedQuery.includes('he thong nay la gi') ||
      normalizedQuery.includes('he thong nay lam gi') ||
      normalizedQuery.includes('he thong la gi') ||
      (normalizedQuery.includes('tinh nang') && !normalizedQuery.includes('tao')) ||
      normalizedQuery.includes('features') ||
      normalizedQuery.includes('chuc nang') ||
      normalizedQuery === 'he thong' ||
      normalizedQuery === 'he thong nay';

    const scored = [];

    for (const doc of this.knowledgeIndex) {
      let score = 0;

      // Ưu tiên đặc biệt cho overview doc khi hỏi về hệ thống tổng quan
      if (isSystemOverviewQuery && (doc.id === 'overview' || doc.category === 'overview')) {
        score += 20; // Boost rất cao cho overview
      }

      // 1. Keyword matching với question patterns (HIGHEST PRIORITY)
      const matchingPatterns = doc.questionPatterns.filter(pattern =>
        normalizedQuery.includes(this.normalizeQuery(pattern))
      );
      score += matchingPatterns.length * 10; // 🔴 TĂNG: từ 5 lên 10 - ưu tiên pattern match rất cao

      // 2. Embedding similarity
      const embeddingSimilarity = this.calculateEmbeddingSimilarity(queryEmbedding, doc.embedding);
      score += embeddingSimilarity * 3;

      // 3. Keyword overlap
      const docKeywords = doc.keywords || [];
      const matchingKeywords = queryKeywords.filter(kw =>
        docKeywords.some(dk => dk.includes(kw) || kw.includes(dk))
      );
      score += matchingKeywords.length * 2;

      // 4. Category matching
      if (normalizedQuery.includes(doc.category)) {
        score += 3;
      }

      // 5. 🔴 TĂNG PENALTY cho overview nếu KHÔNG phải câu hỏi về tổng quan
      if (!isSystemOverviewQuery && (doc.id === 'overview' || doc.category === 'overview')) {
        score *= 0.1; // 🔴 GIẢM: từ 0.3 xuống 0.1 - loại bỏ overview nếu không phải overview query
      }

      if (score > 0) {
        scored.push({
          ...doc,
          score,
        });
      }
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Generate answer từ knowledge documents (RAG generation)
   * Chỉ trả về câu trả lời chính, không có phần "Thông tin liên quan"
   */
  generateKnowledgeAnswer(query, knowledgeDocs) {
    if (!knowledgeDocs || knowledgeDocs.length === 0) {
      // Fallback: thử dùng hàm cũ
      const fallbackAnswer = findAnswerFromKnowledge(query);
      if (fallbackAnswer) {
        return fallbackAnswer;
      }
      return null;
    }

    const normalizedQuery = this.normalizeQuery(query);

    // 🔴 PRIORITY: Tìm doc có id chứa keyword cụ thể từ query
    // Ví dụ: query="tạo task" → ưu tiên doc có id="tasks_create"
    const specificKeywordDocs = knowledgeDocs.filter(doc => {
      if (normalizedQuery.includes('tao task') && doc.id.includes('task') && doc.id.includes('create')) return true;
      if (normalizedQuery.includes('tao project') && doc.id.includes('project') && doc.id.includes('create')) return true;
      if (normalizedQuery.includes('tao team') && doc.id.includes('team') && doc.id.includes('create')) return true;
      if (normalizedQuery.includes('dang nhap') && doc.id.includes('login')) return true;
      if (normalizedQuery.includes('dang ky') && doc.id.includes('register')) return true;
      return false;
    });

    // Nếu tìm được doc chính xác, return nó ngay
    if (specificKeywordDocs.length > 0) {
      console.log('[RAG] Found specific keyword match:', specificKeywordDocs[0].id);
      return specificKeywordDocs[0].answer;
    }

    // Ưu tiên doc "overview" nếu hỏi về hệ thống tổng quan
    const isSystemOverviewQuery = 
      normalizedQuery.includes('he thong nay la gi') ||
      normalizedQuery.includes('he thong nay lam gi') ||
      normalizedQuery.includes('he thong la gi') ||
      normalizedQuery.includes('tinh nang') ||
      normalizedQuery.includes('features') ||
      normalizedQuery.includes('chuc nang') ||
      normalizedQuery === 'he thong' ||
      normalizedQuery === 'he thong nay';

    // Tìm doc overview trong kết quả
    const overviewDoc = knowledgeDocs.find(doc => doc.id === 'overview' || doc.category === 'overview');
    
    // Nếu hỏi về tổng quan và có overview doc, ưu tiên nó
    if (isSystemOverviewQuery && overviewDoc) {
      console.log('[RAG] Returning overview doc');
      return overviewDoc.answer;
    }

    // Lọc các doc có score quá thấp (dưới 3)
    const relevantDocs = knowledgeDocs.filter(doc => doc.score >= 3);

    if (relevantDocs.length === 0) {
      // Nếu không có doc nào đủ điểm, thử fallback
      const fallbackAnswer = findAnswerFromKnowledge(query);
      if (fallbackAnswer) {
        return fallbackAnswer;
      }
      return null;
    }

    // Chọn doc có score cao nhất làm câu trả lời chính
    const mainDoc = relevantDocs[0];
    console.log('[RAG] Returning mainDoc:', mainDoc.id, 'score:', mainDoc.score.toFixed(2));
    
    // Nếu main doc là overview và không phải câu hỏi về tổng quan, có thể cần doc khác
    if (mainDoc.id === 'overview' && !isSystemOverviewQuery && relevantDocs.length > 1) {
      // Bỏ qua overview, lấy doc tiếp theo
      const nextDoc = relevantDocs.find(doc => doc.id !== 'overview');
      if (nextDoc && nextDoc.score >= 4) {
        console.log('[RAG] Skipping overview, returning next doc:', nextDoc.id);
        return nextDoc.answer;
      }
    }

    // Trả về doc chính - CHỈ câu trả lời, không có phần "Thông tin liên quan"
    return mainDoc.answer;
  }

  /**
   * Retrieve personal data (tasks, calendar, diary) dựa trên query
   */
  async retrievePersonalData(userId, query) {
    const results = {
      tasks: [],
      calendar: [],
      diary: [],
    };

    try {
      // Retrieve tasks (đã có trong task-suggestion.helper)
      const tasks = await taskSuggestionHelper.getUserTasks(userId);
      if (tasks.length > 0) {
        const taskIndex = taskSuggestionHelper.buildTaskIndex(tasks);
        results.tasks = taskSuggestionHelper.retrieveTasksByQuery(taskIndex, query, null, 10);
      }

      // Retrieve calendar events
      const normalizedQuery = this.normalizeQuery(query);
      const hasTimeKeyword = normalizedQuery.includes('hom nay') || 
                            normalizedQuery.includes('ngay mai') ||
                            normalizedQuery.includes('tuan nay') ||
                            normalizedQuery.includes('thang nay');

      if (hasTimeKeyword || normalizedQuery.includes('lich') || normalizedQuery.includes('event')) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const calendarEvents = await Calendar.find({
          listUser: userId,
          deleted: false,
          $or: [
            { timeStart: { $gte: today, $lte: nextWeek } },
            { timeFinish: { $gte: today, $lte: nextWeek } }
          ]
        }).sort({ timeStart: 1 }).limit(20);

        results.calendar = calendarEvents;
      }

      // Retrieve diary entries (nếu query liên quan đến diary/nhật ký)
      if (normalizedQuery.includes('diary') || normalizedQuery.includes('nhat ky') || normalizedQuery.includes('ghi chu')) {
        const diaryEntries = await Diary.find({
          createdBy: userId,
          deleted: false
        }).sort({ createdAt: -1 }).limit(10);

        results.diary = diaryEntries;
      }
    } catch (error) {
      console.error('Error retrieving personal data:', error);
    }

    return results;
  }

  /**
   * Generate response với RAG đầy đủ (KHÔNG dùng codebase search)
   */
  async generateResponse(userQuery, conversationHistory = [], userId = null, userRole = 'USER') {
    const normalized = this.normalizeQuery(userQuery);
    console.log('[RAG] Query:', userQuery);
    console.log('[RAG] Normalized:', normalized);
    console.log('[RAG] User Role:', userRole);

    // 🔴 SPECIAL: Nếu query có "hướng dẫn" hoặc "cách" → luôn return knowledge, không dùng personal_task
    // Ngay cả khi có "tạo task", nếu có "hướng dẫn" thì return guide, không return personal data
    const isHowToQuery = normalized.includes('huong dan') || normalized.includes('cach') || normalized.includes('the nao');
    console.log('[RAG] isHowToQuery:', isHowToQuery);
    
    if (isHowToQuery) {
      console.log('[RAG] 🔴 Detected HOW-TO query - returning knowledge guide');
      const knowledgeDocs = await this.retrieveKnowledge(userQuery, 5);
      console.log('[RAG] Retrieved docs:', knowledgeDocs.map(d => ({ id: d.id, score: d.score.toFixed(2) })));
      
      const answer = this.generateKnowledgeAnswer(userQuery, knowledgeDocs);
      console.log('[RAG] Answer from knowledge:', answer ? answer.substring(0, 50) + '...' : 'null');
      
      if (answer) {
        return {
          answer,
          sources: [],
          context: [],
          isUserGuide: true,
        };
      }
    }

    // 1. Detect intent (bình thường)
    const intent = this.detectIntent(userQuery);
    console.log('[RAG] Intent:', intent);

    // 2. PHÂN QUYỀN THEO ROLE
    const managerIntents = ['team_members', 'project_stats', 'task_assignment'];
    const userOnlyIntents = ['calendar', 'reports']; // Chỉ USER mới có, MANAGER không có

    // Kiểm tra quyền truy cập - CHỈ chặn USER truy cập MANAGER features
    if (managerIntents.includes(intent)) {
      if (userRole !== 'MANAGER') {
        console.log('[RAG] ⛔ USER attempting to access MANAGER feature');
        return {
          answer: '⛔ **Chức năng chỉ dành cho Quản lý (Manager)**\n\n' +
                  'Bạn hiện đang sử dụng tài khoản **Người dùng** (User). ' +
                  'Các chức năng quản lý dự án như xem thành viên, thống kê tiến độ, và gợi ý phân công chỉ dành cho tài khoản **Manager**.\n\n' +
                  '💡 **Các chức năng bạn có thể sử dụng:**\n' +
                  '• Xem task cá nhân của bạn\n' +
                  '• Quản lý lịch và sự kiện\n' +
                  '• Xem báo cáo công việc của bạn\n' +
                  '• Hỏi về cách sử dụng hệ thống',
          sources: [],
          context: [],
          accessDenied: true,
          requiredRole: 'MANAGER',
          currentRole: userRole
        };
      }
    }
    
    // MANAGER được phép xem personal_task (vì họ cũng là thành viên có task riêng)
    // CHỈ chặn calendar và reports nếu cần (hiện tại không chặn)

    // 3. Route theo intent (sau khi đã check quyền)
    if (intent === 'user_guide' || intent === 'general') {
      // Knowledge RAG
      const knowledgeDocs = await this.retrieveKnowledge(userQuery, 5); // Lấy nhiều hơn để filter tốt hơn
      const answer = this.generateKnowledgeAnswer(userQuery, knowledgeDocs);
      
      if (answer) {
        return {
          answer,
          sources: [], // Bỏ hẳn phần "Nguồn tham khảo"
          context: [], // Không trả về context để tránh lộ codebase
          isUserGuide: true,
        };
      }
    }

    // 2.5. Task Context Query - HỎI THÔNG TIN TASK CỤ THỂ
    if (intent === 'task_context' && userId) {
      try {
        const taskInfo = await this.getTaskContextInfo(userQuery, userId);
        if (taskInfo) {
          const answer = this.generateTaskContextAnswer(taskInfo);
          return {
            answer,
            sources: [],
            context: [],
            isTaskContext: true,
            taskInfo
          };
        } else {
          return {
            answer: '❌ **Không tìm thấy task**\n\nTôi không tìm thấy task bạn đang hỏi. Vui lòng kiểm tra lại tên task hoặc hỏi "danh sách task của tôi" để xem tất cả các task hiện có.',
            sources: [],
            context: [],
          };
        }
      } catch (error) {
        console.error('[RAG] Error handling task context query:', error);
        return {
          answer: '❌ **Lỗi khi truy xuất thông tin task**\n\nĐã xảy ra lỗi khi tìm kiếm thông tin task. Vui lòng thử lại sau.',
          sources: [],
          context: [],
        };
      }
    }

    // 3. Personal Task RAG
    if (intent === 'personal_task' && userId) {
      try {
        const analysis = await taskSuggestionHelper.analyzeTasks(userId);
        const suggestionData = taskSuggestionHelper.generateSuggestionMessage(analysis);
        const normalizedQuery = this.normalizeQuery(userQuery);

        // Xác định loại câu hỏi về task
        const queryType = this.getTaskQueryType(userQuery);

        // Nhận diện các câu hỏi về trạng thái/tổng quan (KHÔNG dùng retrieval)
        const isStatusQuery = 
          normalizedQuery.includes('chua hoan thanh') ||
          normalizedQuery.includes('chua lam') ||
          normalizedQuery.includes('con task nao') ||
          normalizedQuery.includes('task nao chua') ||
          normalizedQuery.includes('danh sach task') ||
          normalizedQuery.includes('tat ca task') ||
          normalizedQuery.includes('nhung task nao');

        // Nhận diện câu hỏi về thời gian cụ thể (ngày mai, tuần này, v.v.)
        const isTimeSpecificQuery = 
          normalizedQuery.includes('ngay mai') ||
          normalizedQuery.includes('tuan nay') ||
          normalizedQuery.includes('thang nay') ||
          normalizedQuery.includes('tuan sau');

        // Nhận diện câu hỏi về chủ đề/từ khóa cụ thể trong task (DÙNG retrieval)
        // Ví dụ: "task nào về backend", "task liên quan đến database"
        const isTopicQuery = this.isTopicSpecificQuery(userQuery);

        let answer;
        let extraData = {};

        // Xử lý daily plan
        if (queryType === 'daily_plan') {
          // Trích xuất số ngày từ query
          const daysMatch = userQuery.match(/(\d+)\s*(ngày|ngay|day)/i);
          const numDays = daysMatch ? parseInt(daysMatch[1]) : 1; // Mặc định 1 ngày (ngày mai)
          
          // Gọi hàm lập kế hoạch tùy chỉnh
          answer = this.generateCustomPlanAnswer(userQuery, analysis, numDays);
        } 
        // Xử lý priority query
        else if (queryType === 'priority') {
          const rankedTasks = taskSuggestionHelper.rankTasksByPriority(analysis);
          answer = this.generatePriorityAnswer(userQuery, rankedTasks);
          extraData.priorityRanking = rankedTasks;
        }
        // Xử lý câu hỏi về trạng thái/tổng quan
        else if (isStatusQuery) {
          // Trả về danh sách task chưa hoàn thành từ suggestionData
          answer = this.generateIncompleteTasksAnswer(userQuery, suggestionData);
        }
        // Xử lý câu hỏi về thời gian cụ thể
        else if (isTimeSpecificQuery && !isStatusQuery) {
          answer = this.generateTimeSpecificAnswer(userQuery, analysis, suggestionData);
        }
        // Xử lý câu hỏi về chủ đề cụ thể (dùng retrieval)
        else if (isTopicQuery) {
          const taskIndex = taskSuggestionHelper.buildTaskIndex(analysis.allTasks);
          const retrievedTasks = taskSuggestionHelper.retrieveTasksByQuery(taskIndex, userQuery, null, 10);
          
          if (retrievedTasks.length > 0) {
            answer = `Tôi tìm thấy ${retrievedTasks.length} task liên quan đến "${userQuery}":\n\n`;
            retrievedTasks.forEach((task, idx) => {
              const formatted = taskSuggestionHelper.formatTaskForDisplay(task);
              answer += `${idx + 1}. **${formatted.title}**\n`;
              answer += `   - Trạng thái: ${formatted.status}\n`;
              answer += `   - Độ ưu tiên: ${formatted.priority}\n`;
              answer += `   - Deadline: ${formatted.deadline}\n`;
              if (formatted.content) {
                answer += `   - Mô tả: ${formatted.content.substring(0, 60)}${formatted.content.length > 60 ? '...' : ''}\n`;
              }
              answer += '\n';
            });
          } else {
            answer = this.generateTaskSuggestionAnswer(userQuery, suggestionData);
          }
        }
        // Mặc định: trả lời tổng quan
        else {
          answer = this.generateTaskSuggestionAnswer(userQuery, suggestionData);
        }

        return {
          answer,
          sources: [], // Không có sources từ codebase
          context: [], // Không có context từ codebase
          isTaskSuggestion: true,
          queryType: queryType || 'generic',
          suggestionData: suggestionData,
          ...extraData,
        };
      } catch (error) {
        console.error('Error generating task suggestion:', error);
      }
    }

    // 🔴 NEW: MANAGER Analytics RAG (cho MANAGER role)
    if ((intent === 'team_members' || intent === 'project_stats' || intent === 'task_assignment') && userId) {
      try {
        const managerAnalyticsHelper = require('./manager-analytics.helper');
        console.log('[RAG] 🔴 MANAGER intent detected:', intent);

        // Lấy dự án do manager phụ trách
        const managerProjects = await managerAnalyticsHelper.getManagerProjects(userId);
        console.log('[RAG] Manager projects found:', managerProjects.length);

        if (managerProjects.length === 0) {
          return {
            answer: '📋 Bạn hiện chưa quản lý dự án nào. Hãy tạo hoặc tham gia vào một dự án để xem thông tin quản lý.',
            sources: [],
            context: [],
            isManagerAnalytics: true,
          };
        }

        let answer = '';
        const managerData = {};

        // Helper: Tìm dự án dựa trên tên trong query
        const findProjectByName = (query, projects) => {
          const normalized = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          
          for (const project of projects) {
            const projectNameNormalized = project.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            // Kiểm tra nếu tên dự án xuất hiện trong query
            if (normalized.includes(projectNameNormalized)) {
              console.log('[DEBUG] Found project match:', project.title);
              return project;
            }
          }
          
          // Không tìm thấy dự án nào khớp
          return null;
        };

        // Tìm dự án focus dựa trên query
        const focusProject = findProjectByName(userQuery, managerProjects);

        // Nếu không tìm thấy dự án nào khớp, yêu cầu người dùng chỉ rõ
        if (!focusProject) {
          console.log('[RAG] No project name found in query - requesting clarification');
          
          let projectList = '';
          managerProjects.forEach((project, idx) => {
            projectList += `${idx + 1}. **${project.title}**\n`;
          });

          return {
            answer: `📋 **Vui lòng chỉ rõ tên dự án**\n\n` +
                    `Bạn đang quản lý **${managerProjects.length} dự án**. Vui lòng nêu rõ tên dự án trong câu hỏi để tôi có thể trả lời chính xác.\n\n` +
                    `**Danh sách dự án của bạn:**\n${projectList}\n` +
                    `💡 **Ví dụ câu hỏi:**\n` +
                    `• "Thành viên dự án **${managerProjects[0].title}**"\n` +
                    `• "Tiến độ dự án **${managerProjects[0].title}**"\n` +
                    `• "Gợi ý phân công cho dự án **${managerProjects[0].title}**"`,
            sources: [],
            context: [],
            isManagerAnalytics: true,
            requiresProjectName: true,
            managerProjects: managerProjects.map(p => ({ id: p._id, title: p.title }))
          };
        }

        // TEAM_MEMBERS intent: Liệt kê thành viên trong dự án
        if (intent === 'team_members') {
          console.log('[RAG] Retrieving team members...');
          console.log('[RAG] Focus project:', focusProject.title);
          
          const members = await managerAnalyticsHelper.getProjectMembers(focusProject._id);
          
          managerData.projectName = focusProject.title;
          managerData.members = members;
          answer = managerAnalyticsHelper.formatProjectMembers(members);
          answer = `**Dự án: ${focusProject.title}**\n\n` + answer;
        }
        // PROJECT_STATS intent: Thống kê hoàn thành & chậm trễ
        else if (intent === 'project_stats') {
          console.log('[RAG] Calculating project statistics...');
          console.log('[RAG] Focus project:', focusProject.title);
          
          const stats = await managerAnalyticsHelper.getProjectStats(focusProject._id);
          const memberPerformance = await managerAnalyticsHelper.getMemberPerformance(focusProject._id);
          const overdueTasks = await managerAnalyticsHelper.getOverdueTasks(focusProject._id);

          managerData.projectName = focusProject.title;
          managerData.stats = stats;
          managerData.memberPerformance = memberPerformance;
          managerData.overdueTasks = overdueTasks;

          answer = managerAnalyticsHelper.formatProjectStats(stats, focusProject.title);
          
          if (memberPerformance.length > 0) {
            answer += '\n\n' + managerAnalyticsHelper.formatMemberPerformance(memberPerformance);
          }
          
          if (overdueTasks.length > 0) {
            answer += '\n\n' + managerAnalyticsHelper.formatOverdueTasks(overdueTasks);
          }
        }
        // TASK_ASSIGNMENT intent: Gợi ý phân công
        else if (intent === 'task_assignment') {
          console.log('[RAG] Generating task assignment suggestions...');
          console.log('[RAG] Focus project:', focusProject.title);
          
          const suggestions = await managerAnalyticsHelper.suggestTaskAssignment(focusProject._id, 5);
          const memberPerformance = await managerAnalyticsHelper.getMemberPerformance(focusProject._id);

          managerData.projectName = focusProject.title;
          managerData.suggestions = suggestions;
          managerData.memberPerformance = memberPerformance;

          if (suggestions.length > 0) {
            answer = managerAnalyticsHelper.formatAssignmentSuggestions(suggestions);
          } else {
            answer = '✅ Tất cả tasks đã được phân công hoặc dự án không có tasks pending.';
          }

          if (memberPerformance.length > 0) {
            answer += '\n\n**📊 Hiệu suất thành viên (dùng để tham khảo khi phân công):**\n\n';
            answer += managerAnalyticsHelper.formatMemberPerformance(memberPerformance);
          }

          answer = `**Dự án: ${focusProject.title}**\n\n` + answer;
        }

        return {
          answer,
          sources: [],
          context: [],
          isManagerAnalytics: true,
          managerIntent: intent,
          managerData: managerData,
        };
      } catch (error) {
        console.error('[RAG] Error in MANAGER analytics:', error);
        return {
          answer: '⚠️ Có lỗi khi lấy dữ liệu quản lý. Vui lòng thử lại sau.',
          sources: [],
          context: [],
          isManagerAnalytics: true,
          error: error.message,
        };
      }
    }

    // 5. Calendar RAG
    if (intent === 'calendar' && userId) {
      try {
        const personalData = await this.retrievePersonalData(userId, userQuery);
        const events = personalData.calendar || [];

        if (events.length > 0) {
          let answer = `📅 **Lịch làm việc của bạn:**\n\n`;
          events.slice(0, 10).forEach((event, idx) => {
            const startDate = new Date(event.timeStart).toLocaleDateString('vi-VN');
            const startTime = new Date(event.timeStart).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            answer += `${idx + 1}. **${event.title}**\n`;
            answer += `   - Thời gian: ${startDate} lúc ${startTime}\n`;
            if (event.description) {
              answer += `   - Mô tả: ${event.description.substring(0, 50)}${event.description.length > 50 ? '...' : ''}\n`;
            }
            if (event.location) {
              answer += `   - Địa điểm: ${event.location}\n`;
            }
            answer += `   - Loại: ${event.type}\n\n`;
          });

          return {
            answer,
            sources: [], // Không có sources từ codebase
            context: [], // Không có context từ codebase
            isCalendar: true,
          };
        } else {
          return {
            answer: '📅 Bạn không có sự kiện nào trong khoảng thời gian này. Bạn có thể tạo event mới trong Calendar.',
            sources: [], // Không có sources từ codebase
            context: [], // Không có context từ codebase
            isCalendar: true,
          };
        }
      } catch (error) {
        console.error('Error retrieving calendar:', error);
      }
    }

    // 6. Reports intent (có thể mở rộng sau)
    if (intent === 'reports' && userId) {
      try {
        const analysis = await taskSuggestionHelper.analyzeTasks(userId);
        let answer = '📊 **Báo cáo công việc của bạn:**\n\n';
        answer += `• Tổng số task: ${analysis.total}\n`;
        answer += `• Đã hoàn thành: ${analysis.completedTasks.length}\n`;
        answer += `• Chưa hoàn thành: ${analysis.total - analysis.completedTasks.length}\n`;
        answer += `• Task quá hạn: ${analysis.overdueTasks.length}\n`;
        answer += `• Task hôm nay: ${analysis.todayTasks.length}\n`;
        answer += `• Task sắp đến deadline: ${analysis.upcomingDeadlines.length}\n`;
        answer += `• Task ưu tiên cao: ${analysis.highPriorityTasks.filter(t => 
          t.status !== 'Hoàn thành' && t.status !== 'hoàn thành'
        ).length}\n`;

        const completionRate = analysis.total > 0 
          ? Math.round((analysis.completedTasks.length / analysis.total) * 100) 
          : 0;
        answer += `\n📈 **Tỷ lệ hoàn thành: ${completionRate}%**\n`;

        return {
          answer,
          sources: [], // Không có sources từ codebase
          context: [], // Không có context từ codebase
          isReport: true,
        };
      } catch (error) {
        console.error('Error generating report:', error);
      }
    }

    // 7. Fallback: thử Knowledge RAG một lần nữa với query gốc
    const knowledgeDocs = await this.retrieveKnowledge(userQuery, 5);
    const fallbackAnswer = this.generateKnowledgeAnswer(userQuery, knowledgeDocs);
    
    if (fallbackAnswer) {
      return {
        answer: fallbackAnswer,
        sources: [], // Bỏ hẳn phần "Nguồn tham khảo"
        context: [], // Không trả về context để tránh lộ codebase
        isUserGuide: true,
      };
    }

    // 8. Final fallback
    const fallback =
      "Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn. Tôi có thể giúp bạn:\n\n" +
      "📖 **Hướng dẫn sử dụng hệ thống**\n" +
      "• Cách đăng ký, đăng nhập\n" +
      "• Cách tạo task, project, team\n" +
      "• Cách sử dụng calendar, reports\n\n" +
      "💼 **Quản lý công việc cá nhân**\n" +
      "• Xem task hôm nay, sắp deadline\n" +
      "• Gợi ý ưu tiên, lập kế hoạch\n" +
      "• Xem lịch làm việc\n\n" +
      "📊 **Báo cáo và thống kê**\n" +
      "• Thống kê task, tỷ lệ hoàn thành\n\n" +
      "Hãy thử hỏi cụ thể hơn, ví dụ: 'Làm sao để tạo task?', 'Hôm nay tôi cần làm gì?', 'Xem lịch của tôi'";
    
    return {
      answer: fallback,
      sources: [], // Không có sources từ codebase
      context: [], // Không có context từ codebase
      isUserGuide: false,
    };
  }

  /**
   * Generate answer từ context với ngôn ngữ tự nhiên
   */
  generateAnswer(query, context, history) {
    if (context.length === 0) {
      return "Xin lỗi, tôi không tìm thấy thông tin liên quan. Bạn có thể:\n\n" +
             "• Hỏi về cách sử dụng hệ thống (ví dụ: 'Làm sao để tạo task?')\n" +
             "• Hỏi về các tính năng (ví dụ: 'Tính năng nào có trong hệ thống?')\n" +
             "• Thử câu hỏi khác với từ khóa cụ thể hơn";
    }

    const lowerQuery = query.toLowerCase();
    let answer = '';

    // Phân tích query để xác định loại câu hỏi
    const isHowQuestion = lowerQuery.includes('làm sao') || lowerQuery.includes('how') || 
                          lowerQuery.includes('cách') || lowerQuery.includes('thế nào');
    const isWhatQuestion = lowerQuery.includes('là gì') || lowerQuery.includes('what') ||
                          lowerQuery.includes('tính năng') || lowerQuery.includes('features');
    const isApiQuestion = lowerQuery.includes('api') || lowerQuery.includes('endpoint') ||
                         lowerQuery.includes('route');
    const isCodeQuestion = lowerQuery.includes('code') || lowerQuery.includes('function') ||
                          lowerQuery.includes('hàm');

    // Group context by file và type
    const byFile = {};
    const functions = [];
    const routes = [];
    const models = [];

    context.forEach(ctx => {
      if (!byFile[ctx.path]) byFile[ctx.path] = [];
      byFile[ctx.path].push(ctx);

      if (ctx.path.includes('routes')) routes.push(ctx);
      else if (ctx.path.includes('models')) models.push(ctx);
      else if (ctx.type === 'function' || ctx.type === 'export') functions.push(ctx);
    });

    // Generate natural language answer based on query type
    if (isHowQuestion) {
      answer = this.generateHowAnswer(query, context, functions, routes);
    } else if (isWhatQuestion) {
      answer = this.generateWhatAnswer(query, context, functions, models);
    } else if (isApiQuestion) {
      answer = this.generateApiAnswer(query, routes, functions);
    } else if (isCodeQuestion) {
      answer = this.generateCodeAnswer(query, context, functions);
    } else {
      // Default: General explanation
      answer = this.generateGeneralAnswer(query, context, byFile);
    }

    return answer;
  }

  /**
   * Generate answer cho câu hỏi "Làm sao..."
   */
  generateHowAnswer(query, context, functions, routes) {
    let answer = 'Dựa trên hệ thống, đây là cách thực hiện:\n\n';

    // Tìm các functions liên quan
    if (functions.length > 0) {
      const mainFunction = functions[0];
      answer += `**Cách thực hiện:**\n\n`;
      
      // Phân tích function để tạo hướng dẫn
      if (mainFunction.name.includes('create') || mainFunction.name.includes('add')) {
        answer += `1. Hệ thống có chức năng tạo mới trong module "${mainFunction.path.split('/').pop()}"\n`;
        answer += `2. Bạn có thể sử dụng chức năng này thông qua giao diện hoặc API\n`;
        answer += `3. Đảm bảo điền đầy đủ thông tin bắt buộc\n`;
      } else if (mainFunction.name.includes('update') || mainFunction.name.includes('edit')) {
        answer += `1. Hệ thống hỗ trợ chỉnh sửa thông tin\n`;
        answer += `2. Tìm item cần chỉnh sửa trong danh sách\n`;
        answer += `3. Click vào nút "Sửa" hoặc "Chỉnh sửa"\n`;
        answer += `4. Thay đổi thông tin và lưu lại\n`;
      } else if (mainFunction.name.includes('delete') || mainFunction.name.includes('remove')) {
        answer += `1. Tìm item cần xóa trong danh sách\n`;
        answer += `2. Click vào nút "Xóa" hoặc icon thùng rác\n`;
        answer += `3. Xác nhận việc xóa\n`;
      }

      // Thêm thông tin về route nếu có
      if (routes.length > 0) {
        const route = routes[0];
        const endpoint = this.extractEndpoint(route.path, route.name);
        if (endpoint) {
          answer += `\n**API Endpoint:** ${endpoint}\n`;
        }
      }
    } else {
      answer += `Hệ thống hỗ trợ tính năng này. Bạn có thể:\n`;
      answer += `1. Truy cập vào menu tương ứng\n`;
      answer += `2. Sử dụng các nút chức năng trên giao diện\n`;
      answer += `3. Làm theo hướng dẫn trên màn hình\n`;
    }

    answer += `\n💡 **Mẹo:** Nếu bạn cần hướng dẫn chi tiết hơn, hãy hỏi cụ thể về từng bước!`;

    return answer;
  }

  /**
   * Generate answer cho câu hỏi "Là gì..."
   */
  generateWhatAnswer(query, context, functions, models) {
    let answer = 'Dựa trên hệ thống:\n\n';

    if (models.length > 0) {
      const model = models[0];
      answer += `**Thông tin về module:**\n`;
      answer += `- Module này quản lý dữ liệu liên quan đến "${model.name}"\n`;
      answer += `- Nằm trong file: ${model.path}\n`;
      answer += `- Có các trường dữ liệu và chức năng cơ bản\n\n`;
    }

    if (functions.length > 0) {
      answer += `**Các chức năng có sẵn:**\n`;
      functions.slice(0, 3).forEach((func, idx) => {
        answer += `${idx + 1}. ${this.getFunctionDescription(func.name)}\n`;
      });
    }

    answer += `\n💡 Bạn có thể sử dụng các chức năng này thông qua giao diện hoặc API.`;

    return answer;
  }

  /**
   * Generate answer cho câu hỏi về API
   */
  generateApiAnswer(query, routes, functions) {
    let answer = '**Thông tin về API:**\n\n';

    if (routes.length > 0) {
      routes.forEach((route, idx) => {
        const endpoint = this.extractEndpoint(route.path, route.name);
        answer += `${idx + 1}. **${route.name || 'Endpoint'}**\n`;
        if (endpoint) {
          answer += `   - URL: ${endpoint}\n`;
        }
        answer += `   - File: ${route.path}\n\n`;
      });
    } else {
      answer += `Hệ thống sử dụng RESTful API với các endpoint chuẩn.\n`;
      answer += `Các endpoint thường có dạng: /api/v1/[resource]/[action]\n\n`;
    }

    answer += `💡 **Lưu ý:** Để sử dụng API, bạn cần:\n`;
    answer += `- Đăng nhập để lấy token\n`;
    answer += `- Gửi token trong header Authorization\n`;
    answer += `- Sử dụng đúng method (GET, POST, PUT, DELETE)`;

    return answer;
  }

  /**
   * Generate answer cho câu hỏi về code
   */
  generateCodeAnswer(query, context, functions) {
    let answer = '**Thông tin về code:**\n\n';

    if (functions.length > 0) {
      answer += `Hệ thống có các functions liên quan:\n\n`;
      functions.slice(0, 3).forEach((func, idx) => {
        answer += `${idx + 1}. **${func.name}**\n`;
        answer += `   - Loại: ${func.type}\n`;
        answer += `   - File: ${func.path}\n`;
        answer += `   - Mô tả: ${this.getFunctionDescription(func.name)}\n\n`;
      });
    }

    answer += `💡 Nếu bạn cần xem code chi tiết, có thể tham khảo các file trong codebase.`;

    return answer;
  }

  /**
   * Generate general answer
   */
  generateGeneralAnswer(query, context, byFile) {
    let answer = 'Dựa trên thông tin trong hệ thống:\n\n';

    const fileCount = Object.keys(byFile).length;
    if (fileCount > 0) {
      answer += `Tôi tìm thấy thông tin liên quan trong ${fileCount} file:\n\n`;
      
      Object.entries(byFile).slice(0, 3).forEach(([filePath, chunks]) => {
        answer += `📁 **${filePath.split('/').pop()}**\n`;
        answer += `   - Có ${chunks.length} phần liên quan\n`;
        if (chunks[0].name) {
          answer += `   - Chức năng chính: ${chunks[0].name}\n`;
        }
        answer += '\n';
      });
    }

    answer += `💡 Bạn có thể hỏi cụ thể hơn để tôi trả lời chi tiết hơn!`;

    return answer;
  }

  /**
   * Extract endpoint từ route path
   */
  extractEndpoint(filePath, functionName) {
    // Tìm pattern /api/v1/... trong code
    if (filePath.includes('routes')) {
      const parts = filePath.split('/');
      const routeFile = parts[parts.length - 1];
      const resource = routeFile.replace('.route.js', '').replace('.js', '');
      return `/api/v1/${resource}`;
    }
    return null;
  }

  /**
   * Get function description in Vietnamese
   */
  getFunctionDescription(functionName) {
    const descriptions = {
      'create': 'Tạo mới một item',
      'add': 'Thêm mới',
      'update': 'Cập nhật thông tin',
      'edit': 'Chỉnh sửa',
      'delete': 'Xóa item',
      'remove': 'Gỡ bỏ',
      'get': 'Lấy thông tin',
      'list': 'Lấy danh sách',
      'search': 'Tìm kiếm',
      'login': 'Đăng nhập',
      'logout': 'Đăng xuất',
      'register': 'Đăng ký',
    };

    const lowerName = functionName.toLowerCase();
    for (const [key, desc] of Object.entries(descriptions)) {
      if (lowerName.includes(key)) {
        return desc;
      }
    }
    return 'Chức năng trong hệ thống';
  }

  /**
   * Kiểm tra xem query có phải là câu hỏi về gợi ý/nhắc nhở task không
   */
  isTaskSuggestionQuery(query) {
    if (!query) return false;

    // Chuẩn hóa tiếng Việt: đưa về lowercase, bỏ dấu, bỏ khoảng trắng thừa
    const normalizeText = (text) => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // bỏ dấu tiếng Việt
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const normalized = normalizeText(query);

    // Các cụm từ khoá phổ biến (đã bỏ dấu)
    const suggestionKeywords = [
      'task nao can lam',
      'task nao sap',
      'task hom nay',
      'task nao qua han',
      'task nao uu tien',
      'cong viec nao',
      'co task nao',
      'nhac nho',
      'goi y',
      'toi can lam gi',
      'hom nay toi can lam gi',
      'lam gi hom nay',
      'cong viec can lam',
      'task can lam',
      'nhiem vu',
      'tong quan task',
      'thong ke task',
      'task nao dang',
      'task chua hoan thanh',
      'cong viec chua hoan thanh',
      'cong viec dang lam',
      'cong viec sap den deadline',
      'task sap den deadline',
      'viec hom nay',
      'viec ngay mai',
    ];

    // Kiểm tra chứa cụm từ khoá
    if (suggestionKeywords.some((kw) => normalized.includes(kw))) {
      return true;
    }

    // Nhận diện nhanh các câu hỏi lập kế hoạch (kể cả không nhắc tới từ "task")
    if (
      (normalized.includes('lap ke hoach') && normalized.includes('hom nay')) ||
      (normalized.includes('ke hoach') && normalized.includes('hom nay')) ||
      normalized.includes('plan hom nay') ||
      (normalized.includes('lap ke hoach') && normalized.includes('ngay mai'))
    ) {
      return true;
    }

    // Nhận diện nhanh các câu hỏi ưu tiên đơn giản ("nen lam task nao truoc")
    if (
      normalized.includes('nen lam task nao truoc') ||
      normalized.includes('task nao nen lam truoc') ||
      normalized.includes('nen lam gi truoc')
    ) {
      return true;
    }

    // Pattern tổng quát hơn: câu hỏi "hỏi việc" + thời gian
    const hasTaskWord =
      normalized.includes('task') ||
      normalized.includes('cong viec') ||
      normalized.includes('viec');

    const hasTimeWord =
      normalized.includes('hom nay') ||
      normalized.includes('ngay mai') ||
      normalized.includes('tuan nay') ||
      normalized.includes('sap den') ||
      normalized.includes('deadline');

    const hasQuestionVerb =
      normalized.includes('can lam gi') ||
      normalized.includes('lam gi') ||
      normalized.includes('chua hoan thanh') ||
      normalized.includes('dang lam');

    return (hasTaskWord && hasTimeWord) || (hasTaskWord && hasQuestionVerb);
  }

  /**
   * Xác định loại câu hỏi về task: daily_plan | priority | generic
   */
  getTaskQueryType(query) {
    if (!query) return 'generic';

    const normalizeText = (text) => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const normalized = normalizeText(query);

    // Nhận diện câu hỏi lập kế hoạch với số ngày cụ thể
    // Ví dụ: "lập kế hoạch 3 ngày", "kế hoạch cho 5 ngày tới", "10 ngày"
    if (
      normalized.includes('lap ke hoach') ||
      normalized.includes('ke hoach') ||
      normalized.includes('plan')
    ) {
      return 'daily_plan';
    }

    // Nhận diện câu hỏi gợi ý ưu tiên
    if (
      normalized.includes('task nao nen lam truoc') ||
      normalized.includes('nen lam task nao truoc') ||
      normalized.includes('goi y uu tien') ||
      normalized.includes('viec nao uu tien') ||
      normalized.includes('task nao quan trong') ||
      normalized.includes('task quan trong nhat') ||
      normalized.includes('nen uu tien') ||
      (normalized.includes('goi y') && normalized.includes('uu tien'))
    ) {
      return 'priority';
    }

    return 'generic';
  }

  /**
   * Kiểm tra xem query có phải là câu hỏi về chủ đề/từ khóa cụ thể trong task không
   * Ví dụ: "task nào về backend", "task liên quan đến database"
   */
  isTopicSpecificQuery(query) {
    if (!query) return false;

    const normalized = this.normalizeQuery(query);

    // Các từ khóa chỉ ra đây là câu hỏi về chủ đề cụ thể
    const topicKeywords = [
      've',
      'lien quan den',
      'về',
      'liên quan',
      'chua',
      'co',
      'bao gom',
      'thuoc',
      'cua',
    ];

    // Các từ khóa loại trừ (không phải câu hỏi về chủ đề)
    const excludeKeywords = [
      'chua hoan thanh',
      'chua lam',
      'con task nao',
      'task nao chua',
      'danh sach',
      'tat ca',
      'nhung task nao',
      'hom nay',
      'ngay mai',
      'tuan nay',
      'thang nay',
      'lam gi',
      'can lam gi',
    ];

    // Nếu có từ khóa loại trừ → không phải topic query
    if (excludeKeywords.some(kw => normalized.includes(kw))) {
      return false;
    }

    // Nếu có từ khóa topic và có từ khóa cụ thể (dài > 3 ký tự, không phải stop word)
    const hasTopicKeyword = topicKeywords.some(kw => normalized.includes(kw));
    const words = normalized.split(' ').filter(w => w.length > 3);
    const stopWords = ['task', 'cong', 'viec', 'nhiem', 'vu', 'lam', 'gi', 'nao', 'cua', 'ban'];
    const hasSpecificWord = words.some(w => !stopWords.includes(w));

    return hasTopicKeyword && hasSpecificWord;
  }

  /**
   * Tạo câu trả lời cho task chưa hoàn thành
   */
  generateIncompleteTasksAnswer(query, suggestionData) {
    if (!suggestionData || !suggestionData.incompleteTasks || suggestionData.incompleteTasks.length === 0) {
      return '🎉 Tuyệt vời! Bạn đã hoàn thành tất cả các task. Không có task nào chưa hoàn thành.';
    }

    let answer = `📋 **Danh sách task chưa hoàn thành (${suggestionData.incompleteTasks.length} task):**\n\n`;

    suggestionData.incompleteTasks.forEach((task, idx) => {
      answer += `${idx + 1}. **${task.title}**\n`;
      answer += `   - Trạng thái: ${task.status}\n`;
      answer += `   - Độ ưu tiên: ${task.priority}\n`;
      answer += `   - Deadline: ${task.deadline}\n`;
      if (task.content) {
        answer += `   - Mô tả: ${task.content.substring(0, 60)}${task.content.length > 60 ? '...' : ''}\n`;
      }
      answer += '\n';
    });

    // Thêm thông tin tổng hợp nếu có
    if (suggestionData.summary) {
      answer += '\n📊 **Tổng quan:**\n';
      answer += `• Tổng số task: ${suggestionData.summary.total}\n`;
      answer += `• Đã hoàn thành: ${suggestionData.summary.completed || 0}\n`;
      answer += `• Chưa hoàn thành: ${suggestionData.incompleteTasks.length}\n`;
      if (suggestionData.summary.overdue > 0) {
        answer += `• ⚠️ Task quá hạn: ${suggestionData.summary.overdue}\n`;
      }
    }

    return answer;
  }

  /**
   * Tạo câu trả lời cho câu hỏi về thời gian cụ thể (ngày mai, tuần này)
   */
  generateTimeSpecificAnswer(query, analysis, suggestionData) {
    const normalized = this.normalizeQuery(query);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let answer = '';
    let relevantTasks = [];

    if (normalized.includes('ngay mai')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      relevantTasks = analysis.allTasks.filter(task => {
        if (task.status === 'Hoàn thành' || task.status === 'hoàn thành') return false;
        if (!task.timeFinish) return false;
        const deadline = new Date(task.timeFinish);
        deadline.setHours(0, 0, 0, 0);
        return deadline.getTime() === tomorrow.getTime();
      });

      answer = `📅 **Task cần làm ngày mai (${tomorrow.toLocaleDateString('vi-VN')}):**\n\n`;
    } else if (normalized.includes('tuan nay')) {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      relevantTasks = analysis.allTasks.filter(task => {
        if (task.status === 'Hoàn thành' || task.status === 'hoàn thành') return false;
        if (!task.timeFinish) return false;
        const deadline = new Date(task.timeFinish);
        deadline.setHours(0, 0, 0, 0);
        return deadline >= today && deadline <= nextWeek;
      });

      answer = `📅 **Task trong tuần này:**\n\n`;
    } else if (normalized.includes('thang nay')) {
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      relevantTasks = analysis.allTasks.filter(task => {
        if (task.status === 'Hoàn thành' || task.status === 'hoàn thành') return false;
        if (!task.timeFinish) return false;
        const deadline = new Date(task.timeFinish);
        deadline.setHours(0, 0, 0, 0);
        return deadline >= today && deadline <= nextMonth;
      });

      answer = `📅 **Task trong tháng này:**\n\n`;
    }

    if (relevantTasks.length === 0) {
      answer += 'Bạn không có task nào trong khoảng thời gian này. Bạn có thể tạo task mới hoặc hỏi tôi về các task sắp đến deadline.';
    } else {
      relevantTasks.slice(0, 10).forEach((task, idx) => {
        const formatted = taskSuggestionHelper.formatTaskForDisplay(task);
        answer += `${idx + 1}. **${formatted.title}**\n`;
        answer += `   - Trạng thái: ${formatted.status}\n`;
        answer += `   - Độ ưu tiên: ${formatted.priority}\n`;
        answer += `   - Deadline: ${formatted.deadline}\n\n`;
      });

      if (relevantTasks.length > 10) {
        answer += `... và ${relevantTasks.length - 10} task khác.\n`;
      }
    }

    return answer;
  }

  /**
   * Tạo kế hoạch cho ngày mai
   */
  /**
   * Tạo kế hoạch tùy chỉnh cho N ngày tới (sắp xếp theo priority trước, deadline sau)
   */
  generateCustomPlanAnswer(query, analysis, numDays = 1) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + numDays);

    // Lọc task chưa hoàn thành trong khoảng thời gian
    const relevantTasks = analysis.allTasks.filter(task => {
      const status = (task.status || '').toLowerCase();
      const isCompleted = status === 'hoàn thành' || 
                        status === 'hoan thanh' || 
                        status === 'done' || 
                        status === 'completed';
      if (isCompleted) return false;
      
      // Lấy tất cả task chưa hoàn thành (không chỉ deadline trong N ngày)
      return true;
    });

    if (relevantTasks.length === 0) {
      const dateRange = numDays === 1 ? 'ngày mai' : `${numDays} ngày tới`;
      return `📅 **Kế hoạch cho ${dateRange}:**\n\nBạn không có task nào cần làm. Bạn có thể tạo task mới hoặc nghỉ ngơi! 😊`;
    }

    // Sắp xếp theo PRIORITY TRƯỚC, DEADLINE SAU
    const sortedTasks = relevantTasks.sort((a, b) => {
      // 1. Priority weight
      const getPriorityValue = (priority) => {
        if (!priority) return 1;
        const p = (priority || '').toLowerCase();
        if (p.includes('cao') || p.includes('high')) return 3;
        if (p.includes('trung') || p.includes('medium')) return 2;
        return 1;
      };

      // 2. Deadline weight
      const getDeadlineValue = (task) => {
        if (!task.timeFinish) return 999; // Không deadline -> xếp sau
        const deadline = new Date(task.timeFinish);
        const diffDays = Math.floor((deadline - now) / (24 * 60 * 60 * 1000));
        return diffDays; // Càng gần deadline càng nhỏ -> ưu tiên cao hơn
      };

      const aPriority = getPriorityValue(a.priority);
      const bPriority = getPriorityValue(b.priority);
      
      // So sánh priority trước
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Priority cao lên trước
      }
      
      // Nếu priority bằng nhau, so sánh deadline
      return getDeadlineValue(a) - getDeadlineValue(b); // Deadline gần lên trước
    });

    // Tạo lịch làm việc với time slots cụ thể (không chồng chéo)
    // Mỗi task 6 tiếng, nghỉ 1 tiếng giữa các task
    const workHours = [
      { start: 8, end: 14 },   // 8:00-14:00 (6 tiếng)
      { start: 15, end: 21 }   // 15:00-21:00 (6 tiếng, nghỉ 1 tiếng từ 14:00-15:00)
    ];

    const schedule = [];
    let currentDay = 0;
    let slotIndex = 0;

    // Phân bổ tasks vào các time slots
    sortedTasks.forEach((task) => {
      if (currentDay >= numDays) return; // Đã hết số ngày quy hoạch

      const workDate = new Date(today);
      workDate.setDate(workDate.getDate() + currentDay + 1); // +1 để bắt đầu từ ngày mai

      const slot = workHours[slotIndex];
      const formatted = taskSuggestionHelper.formatTaskForDisplay(task);

      schedule.push({
        date: workDate,
        startHour: slot.start,
        endHour: slot.end,
        task: formatted,
        taskRaw: task
      });

      // Chuyển sang slot tiếp theo
      slotIndex++;
      if (slotIndex >= workHours.length) {
        slotIndex = 0;
        currentDay++;
      }
    });

    // Tạo câu trả lời với lịch chi tiết
    const dateRange = numDays === 1 
      ? `ngày mai (${new Date(today.getTime() + 24*60*60*1000).toLocaleDateString('vi-VN')})` 
      : `${numDays} ngày tới`;
    
    let answer = `📅 **Kế hoạch làm việc chi tiết cho ${dateRange}:**\n\n`;

    let currentDisplayDay = null;
    schedule.forEach((item, idx) => {
      const dayStr = item.date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      // Hiển thị header ngày nếu là ngày mới
      if (currentDisplayDay !== dayStr) {
        if (currentDisplayDay !== null) answer += '\n';
        answer += `**${dayStr}:**\n`;
        currentDisplayDay = dayStr;
      }

      const timeSlot = `${item.startHour.toString().padStart(2, '0')}:00 - ${item.endHour.toString().padStart(2, '0')}:00`;
      answer += `⏰ ${timeSlot}: **${item.task.title}**\n`;
      answer += `   • Độ ưu tiên: ${item.task.priority}\n`;
      answer += `   • Deadline: ${item.task.deadline}\n`;
      if (item.task.content) {
        answer += `   • Mô tả: ${item.task.content.substring(0, 50)}${item.task.content.length > 50 ? '...' : ''}\n`;
      }
      answer += '\n';
    });

    if (sortedTasks.length > schedule.length) {
      answer += `\n📌 *Còn ${sortedTasks.length - schedule.length} task khác chưa được xếp lịch. Hãy hoàn thành các task trên trước để có thể tiếp tục.*`;
    }

    return answer;
  }

  /**
   * Lấy thông tin context của task (project, files, links)
   * CHỈ lấy task từ các dự án nhóm mà user tham gia (không phải công việc cá nhân)
   */
  async getTaskContextInfo(query, userId) {
    const Project = require('../../models/project.model');
    
    // Trích xuất tên task từ query
    const taskName = this.extractTaskNameFromQuery(query);
    if (!taskName) return null;

    console.log('[RAG] Searching for task:', taskName);

    try {
      // Convert userId to string vì listUser là Array of Strings
      const userIdStr = userId.toString ? userId.toString() : userId;
      
      // Bước 1: Tìm tất cả các dự án nhóm mà user tham gia
      const userProjects = await Project.find({
        projectParentId: { $exists: false }, // Đây là project (không phải task)
        deleted: false,
        listUser: userIdStr // User là thành viên của project
      }).select('_id title content').lean();
      
      console.log('[RAG] Searching for projects with userId:', userIdStr);

      if (userProjects.length === 0) {
        console.log('[RAG] User is not a member of any team project');
        return null;
      }

      const projectIds = userProjects.map(p => p._id.toString());
      console.log('[RAG] User is member of projects:', projectIds);

      // Bước 2: Tìm tasks thuộc các dự án này
      const tasks = await Project.find({
        projectParentId: { $in: projectIds }, // Task thuộc một trong các projects
        deleted: false
      }).lean();

      console.log('[RAG] Found', tasks.length, 'tasks in user\'s projects');

      // Bước 3: Tìm task khớp với tên (fuzzy match)
      const searchName = taskName.toLowerCase();
      const matchedTask = tasks.find(task => {
        const taskTitle = (task.title || '').toLowerCase();
        
        // Normalize Vietnamese characters for better matching
        const normalizeVietnamese = (str) => {
          return str
            .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
            .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
            .replace(/ì|í|ị|ỉ|ĩ/g, 'i')
            .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
            .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
            .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
            .replace(/đ/g, 'd');
        };
        
        const normalizedTitle = normalizeVietnamese(taskTitle);
        const normalizedSearch = normalizeVietnamese(searchName);
        
        const matches = taskTitle.includes(searchName) || 
                       searchName.includes(taskTitle) ||
                       normalizedTitle.includes(normalizedSearch) ||
                       normalizedSearch.includes(normalizedTitle);
        
        if (matches) {
          console.log('[RAG] Found matching task:', task.title);
        }
        
        return matches;
      });

      if (!matchedTask) {
        console.log('[RAG] No task matched the search term:', taskName);
        console.log('[RAG] Available tasks:', tasks.map(t => t.title).join(', '));
        return null;
      }

      // Bước 4: Lấy thông tin project chứa task
      const project = userProjects.find(p => p._id.toString() === matchedTask.projectParentId);

      // Bước 5: Lấy thông tin người tạo task
      const User = require('../../models/user.model');
      let creatorInfo = null;
      if (matchedTask.createdBy) {
        const creator = await User.findById(matchedTask.createdBy).select('fullName email').lean();
        if (creator) {
          creatorInfo = {
            name: creator.fullName,
            email: creator.email
          };
        }
      }

      return {
        task: matchedTask,
        project: project,
        creator: creatorInfo
      };
    } catch (error) {
      console.error('[RAG] Error in getTaskContextInfo:', error);
      return null;
    }
  }

  /**
   * Trích xuất tên task từ query
   */
  extractTaskNameFromQuery(query) {
    const normalized = query.toLowerCase();
    
    // Patterns: "task A nằm trong...", "công việc Y thuộc...", "nhiệm vụ Z có..."
    const patterns = [
      // Pattern 1: "task [tên] nằm trong..."
      /task\s+(.+?)\s+(?:nam trong|thuoc|co tai lieu|co file|lien quan den|trong du an|du an nao|project nao)/i,
      // Pattern 2: "công việc [tên] nằm trong..."
      /cong viec\s+(.+?)\s+(?:nam trong|thuoc|co tai lieu|co file|lien quan den|trong du an|du an nao)/i,
      // Pattern 3: "nhiệm vụ [tên] nằm trong..."
      /nhiem vu\s+(.+?)\s+(?:nam trong|thuoc|co tai lieu|co file|lien quan den|trong du an|du an nao)/i,
      // Pattern 4: Fallback - lấy text sau "task" đến hết
      /task\s+(.+)$/i,
      /cong viec\s+(.+)$/i,
      /nhiem vu\s+(.+)$/i,
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        let extracted = match[1].trim();
        // Loại bỏ các từ khóa cuối câu không cần thiết (nếu vẫn còn)
        extracted = extracted.replace(/\s+(nay|nao|nay|thuoc|nam trong|nam|co|trong|lien quan|du an nao|project nao|tai lieu|file).*$/i, '').trim();
        
        console.log('[RAG] Extracted task name:', extracted);
        return extracted;
      }
    }

    console.log('[RAG] Could not extract task name from query');
    return null;
  }

  /**
   * Generate câu trả lời về task context
   */
  generateTaskContextAnswer(taskInfo) {
    const { task, project, creator } = taskInfo;
    
    let answer = `📌 **Thông tin về task: ${task.title}**\n\n`;

    // Thông tin dự án
    if (project) {
      answer += `🗂️ **Dự án**: ${project.title}\n`;
      if (project.content) {
        const description = project.content.length > 200 
          ? project.content.substring(0, 200) + '...' 
          : project.content;
        answer += `   📝 Mô tả dự án: ${description}\n`;
      }
      answer += `\n`;
    } else {
      answer += `🗂️ **Dự án**: Không xác định (có thể là task độc lập)\n\n`;
    }

    // Thông tin task
    answer += `📋 **Chi tiết task:**\n`;
    
    if (task.content) {
      answer += `   • Mô tả: ${task.content}\n`;
    }
    
    if (task.status) {
      answer += `   • Trạng thái: ${task.status}\n`;
    }
    
    if (task.priority) {
      const priorityMap = {
        'high': '🔴 Cao',
        'cao': '🔴 Cao',
        'medium': '🟡 Trung bình',
        'trung binh': '🟡 Trung bình',
        'low': '🟢 Thấp',
        'thap': '🟢 Thấp'
      };
      const priorityText = priorityMap[task.priority.toLowerCase()] || task.priority;
      answer += `   • Độ ưu tiên: ${priorityText}\n`;
    }
    
    if (task.timeStart) {
      answer += `   • Ngày bắt đầu: ${new Date(task.timeStart).toLocaleDateString('vi-VN')}\n`;
    }
    
    if (task.timeFinish) {
      answer += `   • Deadline: ${new Date(task.timeFinish).toLocaleDateString('vi-VN')}\n`;
    }

    if (task.tags && task.tags.length > 0) {
      answer += `   • Tags: ${task.tags.join(', ')}\n`;
    }
    
    answer += `\n`;

    // Thông tin người tạo
    if (creator) {
      answer += `👤 **Người giao việc**: ${creator.name}\n`;
      if (creator.email) {
        answer += `   📧 Email: ${creator.email}\n`;
      }
      answer += `\n`;
    }

    // Thông tin file đính kèm (nếu có)
    if (task.thumbnail) {
      answer += `📎 **File đính kèm:**\n`;
      answer += `   • [Xem file](${task.thumbnail})\n\n`;
    }

    answer += `💡 **Gợi ý**: Bạn có thể hỏi thêm về các task khác hoặc yêu cầu lập kế hoạch làm việc!`;

    return answer;
  }

  /**
   * [DEPRECATED] Tạo kế hoạch cho ngày mai - Dùng generateCustomPlanAnswer thay thế
   */
  generateTomorrowPlanAnswer(query, analysis, suggestionData) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Lọc task có deadline ngày mai hoặc sắp đến
    const tomorrowTasks = analysis.allTasks.filter(task => {
      if (task.status === 'Hoàn thành' || task.status === 'hoàn thành') return false;
      if (!task.timeFinish) return false;
      const deadline = new Date(task.timeFinish);
      deadline.setHours(0, 0, 0, 0);
      return deadline.getTime() === tomorrow.getTime() || deadline.getTime() <= tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000;
    });

    if (tomorrowTasks.length === 0) {
      return `📅 **Kế hoạch cho ngày mai (${tomorrow.toLocaleDateString('vi-VN')}):**\n\nBạn không có task nào cần làm ngày mai. Bạn có thể tạo task mới hoặc nghỉ ngơi! 😊`;
    }

    // Sắp xếp theo ưu tiên
    const sortedTasks = tomorrowTasks.sort((a, b) => {
      const priorityOrder = { 'Cao': 3, 'cao': 3, 'Trung bình': 2, 'trung bình': 2, 'Thấp': 1, 'thấp': 1 };
      const aPriority = priorityOrder[a.priority] || 1;
      const bPriority = priorityOrder[b.priority] || 1;
      return bPriority - aPriority;
    });

    let answer = `📅 **Kế hoạch gợi ý cho ngày mai (${tomorrow.toLocaleDateString('vi-VN')}):**\n\n`;

    // Phân bổ vào các buổi
    const morning = sortedTasks.slice(0, 3);
    const afternoon = sortedTasks.slice(3, 6);
    const evening = sortedTasks.slice(6, 9);

    if (morning.length > 0) {
      answer += '**Buổi sáng:**\n';
      morning.forEach((task, idx) => {
        const formatted = taskSuggestionHelper.formatTaskForDisplay(task);
        answer += `${idx + 1}. **${formatted.title}**\n`;
        answer += `   - Độ ưu tiên: ${formatted.priority}\n`;
        answer += `   - Deadline: ${formatted.deadline}\n\n`;
      });
    }

    if (afternoon.length > 0) {
      answer += '**Buổi chiều:**\n';
      afternoon.forEach((task, idx) => {
        const formatted = taskSuggestionHelper.formatTaskForDisplay(task);
        answer += `${idx + 1}. **${formatted.title}**\n`;
        answer += `   - Độ ưu tiên: ${formatted.priority}\n`;
        answer += `   - Deadline: ${formatted.deadline}\n\n`;
      });
    }

    if (evening.length > 0) {
      answer += '**Buổi tối:**\n';
      evening.forEach((task, idx) => {
        const formatted = taskSuggestionHelper.formatTaskForDisplay(task);
        answer += `${idx + 1}. **${formatted.title}**\n`;
        answer += `   - Độ ưu tiên: ${formatted.priority}\n`;
        answer += `   - Deadline: ${formatted.deadline}\n\n`;
      });
    }

    return answer;
  }

  /**
   * Tạo câu trả lời cho task suggestion query
   */
  generateTaskSuggestionAnswer(query, suggestionData) {
    const lowerQuery = query.toLowerCase();
    let answer = suggestionData.message + '\n\n';

    // Nếu có suggestions, thêm chi tiết
    if (suggestionData.suggestions && suggestionData.suggestions.length > 0) {
      suggestionData.suggestions.forEach((suggestion, idx) => {
        answer += `**${suggestion.title}**\n`;
        
        if (suggestion.tasks && suggestion.tasks.length > 0) {
          suggestion.tasks.slice(0, 5).forEach((task, taskIdx) => {
            answer += `${taskIdx + 1}. **${task.title}**\n`;
            answer += `   - Trạng thái: ${task.status}\n`;
            answer += `   - Độ ưu tiên: ${task.priority}\n`;
            answer += `   - Deadline: ${task.deadline}\n`;
            if (task.content) {
              answer += `   - Mô tả: ${task.content.substring(0, 50)}${task.content.length > 50 ? '...' : ''}\n`;
            }
            answer += '\n';
          });

          if (suggestion.tasks.length > 5) {
            answer += `... và ${suggestion.tasks.length - 5} task khác.\n\n`;
          }
        }

        answer += `${suggestion.message}\n\n`;
      });
    }

    // Nếu có danh sách task chưa hoàn thành, trả lời chi tiết
    if (suggestionData.incompleteTasks && suggestionData.incompleteTasks.length > 0) {
      answer += '📌 **Danh sách task chưa hoàn thành:**\n\n';
      suggestionData.incompleteTasks.slice(0, 10).forEach((task, idx) => {
        answer += `${idx + 1}. **${task.title}**\n`;
        answer += `   - Trạng thái: ${task.status}\n`;
        answer += `   - Độ ưu tiên: ${task.priority}\n`;
        answer += `   - Deadline: ${task.deadline}\n`;
        if (task.content) {
          answer += `   - Mô tả: ${task.content.substring(0, 80)}${task.content.length > 80 ? '...' : ''}\n`;
        }
        answer += '\n';
      });

      if (suggestionData.incompleteTasks.length > 10) {
        answer += `... và ${suggestionData.incompleteTasks.length - 10} task chưa hoàn thành khác.\n\n`;
      }
    }

    return answer;
  }

  /**
   * Tạo câu trả lời cho câu hỏi lập kế hoạch trong ngày
   */
  generateDailyPlanAnswer(query, suggestionData, dailyPlan) {
    let answer = suggestionData.message + '\n\n';

    if (
      !dailyPlan ||
      ((!dailyPlan.morning || dailyPlan.morning.length === 0) &&
        (!dailyPlan.afternoon || dailyPlan.afternoon.length === 0) &&
        (!dailyPlan.evening || dailyPlan.evening.length === 0))
    ) {
      answer +=
        'Hôm nay bạn không có task nào cần đặc biệt lên kế hoạch. Bạn có thể tạo task mới hoặc hỏi tôi về các task sắp đến deadline.';
      return answer;
    }

    const renderSlot = (title, tasks) => {
      if (!tasks || tasks.length === 0) return '';
      let block = `${title}:\n`;
      tasks.forEach((task, idx) => {
        block += `${idx + 1}. **${task.title}**\n`;
        block += `   - Trạng thái: ${task.status}\n`;
        block += `   - Độ ưu tiên: ${task.priority}\n`;
        block += `   - Deadline: ${task.deadline}\n\n`;
      });
      return block;
    };

    answer += '📅 **Kế hoạch gợi ý cho hôm nay:**\n\n';
    answer += renderSlot('Buổi sáng', dailyPlan.morning);
    answer += renderSlot('Buổi chiều', dailyPlan.afternoon);
    answer += renderSlot('Buổi tối', dailyPlan.evening);

    return answer;
  }

  /**
   * Tạo câu trả lời cho câu hỏi gợi ý ưu tiên
   */
  generatePriorityAnswer(query, rankedTasks) {
    if (!rankedTasks || rankedTasks.length === 0) {
      return 'Hiện tại bạn không có task nào chưa hoàn thành, hoặc tất cả đều có độ ưu tiên thấp.';
    }

    let answer = '🔥 **Gợi ý các task nên ưu tiên:**\n\n';

    rankedTasks.forEach((item, idx) => {
      const task = item.task;
      answer += `${idx + 1}. **${task.title}**\n`;
      answer += `   - Trạng thái: ${task.status}\n`;
      answer += `   - Độ ưu tiên: ${task.priority}\n`;
      answer += `   - Deadline: ${task.deadline}\n`;
      // BỎ: Dòng "Lý do"
      if (task.content) {
        answer += `   - Mô tả: ${task.content.substring(0, 80)}${
          task.content.length > 80 ? '...' : ''
        }\n`;
      }
      answer += '\n';
    });

    return answer;
  }
}

// Singleton instance
const ragService = new RAGService();

module.exports = ragService;

