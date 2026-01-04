const fs = require('fs');
const path = require('path');
const { systemKnowledge, findAnswerFromKnowledge } = require('./system-knowledge');
const taskSuggestionHelper = require('./task-suggestion.helper');
const Calendar = require('../models/calendar.model');
const Diary = require('../models/diary.model');

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

    // Intent: User Guide / FAQ
    if (
      normalized.includes('lam sao') ||
      normalized.includes('cach') ||
      normalized.includes('huong dan') ||
      normalized.includes('the nao') ||
      normalized.includes('dang ky') ||
      normalized.includes('dang nhap') ||
      normalized.includes('tao task') ||
      normalized.includes('tao project') ||
      normalized.includes('tao team') ||
      normalized.includes('xem') && (normalized.includes('task') || normalized.includes('project') || normalized.includes('calendar')) ||
      normalized.includes('tinh nang') ||
      normalized.includes('features') ||
      normalized.includes('he thong nay lam gi')
    ) {
      return 'user_guide';
    }

    // Intent: Personal Task / Work Management
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
      normalized.includes('goi y')
    ) {
      return 'personal_task';
    }

    // Intent: Calendar / Events
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

    // Intent: Reports / Statistics
    if (
      normalized.includes('bao cao') ||
      normalized.includes('thong ke') ||
      normalized.includes('reports') ||
      normalized.includes('statistics') ||
      normalized.includes('tong quan') ||
      normalized.includes('dashboard')
    ) {
      return 'reports';
    }

    // Intent: General / Overview
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

      // 1. Keyword matching với question patterns
      const matchingPatterns = doc.questionPatterns.filter(pattern =>
        normalizedQuery.includes(this.normalizeQuery(pattern))
      );
      score += matchingPatterns.length * 5; // High weight cho exact match

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
        score += 2;
      }

      // 5. Penalty cho overview nếu KHÔNG phải câu hỏi về tổng quan
      if (!isSystemOverviewQuery && (doc.id === 'overview' || doc.category === 'overview')) {
        score *= 0.3; // Giảm điểm của overview
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
    
    // Nếu main doc là overview và không phải câu hỏi về tổng quan, có thể cần doc khác
    if (mainDoc.id === 'overview' && !isSystemOverviewQuery && relevantDocs.length > 1) {
      // Bỏ qua overview, lấy doc tiếp theo
      const nextDoc = relevantDocs.find(doc => doc.id !== 'overview');
      if (nextDoc && nextDoc.score >= 4) {
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
  async generateResponse(userQuery, conversationHistory = [], userId = null) {
    // 1. Detect intent
    const intent = this.detectIntent(userQuery);

    // 2. Route theo intent
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

        // Xử lý daily plan (có thể là hôm nay hoặc ngày mai)
        if (queryType === 'daily_plan') {
          // Kiểm tra xem có phải là "ngày mai" không
          if (normalizedQuery.includes('ngay mai')) {
            // Xử lý kế hoạch cho ngày mai
            answer = this.generateTomorrowPlanAnswer(userQuery, analysis, suggestionData);
          } else {
            // Kế hoạch hôm nay (mặc định)
            const dailyPlan = taskSuggestionHelper.buildDailyPlan(analysis);
            answer = this.generateDailyPlanAnswer(userQuery, suggestionData, dailyPlan);
            extraData.dailyPlan = dailyPlan;
          }
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

    // 4. Calendar RAG
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

    // 5. Reports intent (có thể mở rộng sau)
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

    // 6. Fallback: thử Knowledge RAG một lần nữa với query gốc
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

    // 7. Final fallback
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

    // Nhận diện câu hỏi lập kế hoạch (hôm nay hoặc ngày mai)
    if (
      normalized.includes('lap ke hoach') ||
      normalized.includes('ke hoach') ||
      (normalized.includes('hom nay') && normalized.includes('nen lam gi truoc')) ||
      (normalized.includes('ngay mai') && normalized.includes('nen lam gi')) ||
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
      // Các biến thể linh hoạt hơn
      (normalized.includes('goi y') && normalized.includes('uu tien')) ||
      normalized.includes('nen uu tien')
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
      if (item.reasons && item.reasons.length > 0) {
        answer += `   - Lý do: ${item.reasons.join(', ')}\n`;
      }
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

