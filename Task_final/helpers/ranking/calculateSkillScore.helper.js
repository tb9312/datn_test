const { SKILL_LEVEL_SCORE } = require("../../v1/config/user.ranking.config");

/**
 * Tính điểm kỹ năng trung bình của user (0–100)
 * @param {Array} skills
 * @returns {number}
 */
function calculateSkillScore(skills = []) {
  if (!Array.isArray(skills) || skills.length === 0) return 0;

  const totalScore = skills.reduce((sum, skill) => {
    return sum + (SKILL_LEVEL_SCORE[skill.level] || 0);
  }, 0);

  return totalScore / skills.length;
}

module.exports = calculateSkillScore;