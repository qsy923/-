// ==================== movie-fan-project/api.js ====================
// 统一答题抢票API接口 - 支持外部JSON文件加载
console.log('✅ API.js 加载完成 - 支持JSON文件加载');

const API = {
    // ========== 通用数据加载函数 ==========
    async loadJSONFile(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error(`❌ 加载 ${filePath} 失败:`, error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    },

    // ========== 系统配置接口 ==========
    async getConfig() {
        console.log('[API] 获取系统配置');
        return {
            directTicketEnabled: true,
            examRequired: true,
            maintenanceMode: false,
            prices: {
                fullScore: 9.9,
                highScore: 19.9,
                mediumScore: 29.9,
                lowScore: 49.9
            },
            version: '1.0.0',
            features: {
                simulateExam: true,
                realExam: true,
                seatSelection: true,
                encyclopedia: true
            },
            // ✅ 新增配置：题目数量设置
            examSettings: {
                simulateExamQuestions: 15,  // 模拟考试题目数
                realExamQuestions: 15,       // 答题抢票题目数
                randomSelection: true        // 是否随机抽取
            }
        };
    },

    // ========== 题目相关接口 ==========
    async getExamQuestions(mode = 'simulate', count = 15) {
        console.log(`[API] 加载考试题目: mode=${mode}, count=${count}`);
        
        // ✅ 获取配置
        const config = await this.getConfig();
        const defaultCount = config.examSettings.realExamQuestions;
        
        if (mode === 'simulate') {
            // 模拟考试使用 questions.json
            const result = await this.loadJSONFile('data/questions.json');
            
            if (result.success && result.data) {
                let questions = result.data.questions || result.data;
                
                // 🔄 随机打乱题库
                questions = questions.sort(() => Math.random() - 0.5);
                
                // 限制题目数量（优先使用传入的count，否则用默认值）
                const targetCount = count || config.examSettings.simulateExamQuestions;
                if (questions.length > targetCount) {
                    questions = questions.slice(0, targetCount);
                }
                
                return {
                    success: true,
                    data: {
                        questions: questions,
                        total: questions.length,
                        count: questions.length,
                        mode: mode,
                        source: 'questions.json (随机抽取)'
                    }
                };
            } else {
                // 如果加载失败，使用备用题库
                return await this.getMockQuestions(mode, count || config.examSettings.simulateExamQuestions);
            }
        } else {
            // ✅ 答题抢票模式也随机抽取，传递 count 参数
            return await this.getTicketQuestions(count || defaultCount);
        }
    },

    // ✅ 修改答题抢票题目函数，添加随机抽取和数量限制
    async getTicketQuestions(count = 15) {
        console.log(`[API] 加载答题抢票题目, 数量: ${count}`);
        
        const result = await this.loadJSONFile('data/ticket-questions.json');
        
        if (result.success && result.data) {
            let questions = result.data.questions || result.data;
            
            // ✅ 这里添加随机打乱
            questions = questions.sort(() => Math.random() - 0.5);
            
            // ✅ 限制题目数量
            if (questions.length > count) {
                questions = questions.slice(0, count);
            }
            
            return {
                success: true,
                data: {
                    questions: questions,
                    total: questions.length,
                    count: questions.length,
                    mode: 'real',
                    source: 'ticket-questions.json (随机抽取)'
                }
            };
        } else {
            // 如果加载失败，返回备用题库
            console.warn('⚠️ 使用备用抢票题库');
            return await this.getMockQuestions('real', count);
        }
    },
    
    // 备用模拟题库（当JSON文件加载失败时使用）
    async getMockQuestions(mode = 'simulate', count = 5) {
        const mockQuestions = [
            {
                "id": "q1",
                "question": "电影填场的核心目的是什么？",
                "options": [
                    "单纯冲高电影票房总额",
                    "不挤压路人选择的前提下保住现有排片",
                    "让影院增加电影的黄金场次占比",
                    "减少其他影片的排片数量"
                ],
                "correctAnswer": 1,
                "explanation": "填场是粉丝填补观影人数较少的电影场次拉高上座率，核心目的是在不挤压路人选择的前提下，保证上座率下限，保住现有排片。",
                "category": "movie_fill_seat"
            },
            {
                "id": "q2",
                "question": "相比包场，填场的优势是什么？",
                "options": [
                    "花费资金更多，支持力度更大",
                    "能让电影直接获得更高票房",
                    "低成本实现高上座率，效用更可持续",
                    "能直接让影院增加排片数量"
                ],
                "correctAnswer": 2,
                "explanation": "填场的优势在于用最低的成本实现最高的上座率，将资金和精力效用最大化，是比包场更高效、更可持续的支持方式。",
                "category": "movie_fill_seat"
            }
        ];
        
        // 限制题目数量
        let questions = mockQuestions;
        if (count && questions.length > count) {
            questions = questions.slice(0, count);
        }
        
        return {
            success: true,
            data: {
                questions: questions,
                total: questions.length,
                count: questions.length,
                mode: mode,
                source: 'mock_fallback'
            }
        };
    },
    
    // 提交考试
  // 提交考试（修改版）
async submitExam(mode = 'simulate', answers, originalQuestions = null) {
    console.log(`[API] 提交考试: mode=${mode}, 共${answers.length}题`);
    
    // 初始化统计数据
    let correctCount = 0;
    let totalQuestions = answers.length;
    const questionDetails = [];
    
    // 处理每一题的答题情况
    answers.forEach((answer, index) => {
        const userAnswer = answer.userAnswer;
        const questionId = answer.questionId;
        
        // 从原始题目中查找对应的题目信息
        let question = null;
        let isCorrect = false;
        let correctAnswer = null;
        let explanation = '';
        
        if (originalQuestions && originalQuestions[index]) {
            question = originalQuestions[index];
            correctAnswer = question.correctAnswer;
            explanation = question.explanation || '';
            
            // 判断是否正确
            isCorrect = (userAnswer === correctAnswer);
            if (isCorrect) correctCount++;
        } else {
            // 如果没有原始题目，随机判断
            isCorrect = Math.random() > 0.5;
            if (isCorrect) correctCount++;
            correctAnswer = Math.floor(Math.random() * 4);
            explanation = isCorrect ? '回答正确！' : '正确答案已标记';
        }
        
        // 收集题目详情
        questionDetails.push({
            questionId: questionId,
            questionText: question ? question.question : `题目 ${index + 1}`,
            userAnswer: userAnswer,
            correctAnswer: correctAnswer,
            isCorrect: isCorrect,
            explanation: explanation,
            options: question ? question.options : ['选项A', '选项B', '选项C', '选项D']
        });
    });
    
    // 计算分数
    const score = Math.round((correctCount / totalQuestions) * 100);
    
    if (mode === 'real') {
        // 真实考试根据分数计算价格
        let price = 49.9;
        if (score >= 95) price = 9.9;
        else if (score >= 85) price = 19.9;
        else if (score >= 70) price = 29.9;
        
        return {
            success: true,
            data: {
                score: score,
                correctCount: correctCount,
                totalQuestions: totalQuestions,
                price: price,
                mode: mode,
                questionDetails: questionDetails,  // ✅ 新增：答题详情
                // 统计信息
                wrongCount: totalQuestions - correctCount,
                accuracy: (correctCount / totalQuestions * 100).toFixed(1)
            }
        };
    } else {
        // 模拟考试不收费
        return {
            success: true,
            data: {
                score: score,
                correctCount: correctCount,
                totalQuestions: totalQuestions,
                mode: mode,
                questionDetails: questionDetails,  // ✅ 新增：答题详情
                // 统计信息
                wrongCount: totalQuestions - correctCount,
                accuracy: (correctCount / totalQuestions * 100).toFixed(1)
            }
        };
    }
},
    
   // ========== 向后兼容接口 ==========
async getQuestions() {
    return this.getExamQuestions('simulate', 5);
},

// ✅ 修改：增加 questions 参数用于传递原始题目
async submitAnswers(answers, questions = null) {
    return this.submitExam('simulate', answers, questions);
},

// ✅ 修改：增加 questions 参数
async submitTicketExam(answers, questions = null) {
    return this.submitExam('real', answers, questions);
},
    
    // ========== 其他API接口 ==========
    
    async getSeatConfig() {
        console.log('[API] 获取座位配置');
        
        const result = await this.loadJSONFile('data/seats-config.json');
        
        if (result.success && result.data) {
            return {
                success: true,
                data: result.data
            };
        } else {
            // 备用配置
            return {
                success: true,
                data: {
                    totalSeats: 150,
                    rows: 10,
                    columns: 15,
                    disabledSeats: ["A1", "A2"],
                    occupiedSeats: ["J14", "J15"],
                    seatPrice: 60,
                    packageDiscount: 0.7,
                    maxSelectable: 150
                }
            };
        }
    },
    
    async getEncyclopediaData() {
        console.log('[API] 获取电影科普数据');
        
        const result = await this.loadJSONFile('data/encyclopedia.json');
        
        if (result.success && result.data) {
            return {
                success: true,
                data: result.data
            };
        } else {
            // 备用数据
            return {
                success: true,
                data: {
                    categories: [
                        {
                            id: 'fill_field',
                            title: '填场科普',
                            description: '了解电影填场的相关知识'
                        },
                        {
                            id: 'ground_promotion',
                            title: '地推科普',
                            description: '地面推广活动介绍'
                        }
                    ]
                }
            };
        }
    },
    
    async getUsers() {
        console.log('[API] 获取用户数据');
        
        const result = await this.loadJSONFile('data/users.json');
        
        if (result.success && result.data) {
            return {
                success: true,
                data: result.data
            };
        } else {
            return {
                success: true,
                data: []
            };
        }
    }
};

// 导出到全局
window.API = API;
console.log('✅ API接口已注册（支持JSON文件加载）');