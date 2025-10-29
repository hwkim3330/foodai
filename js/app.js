// app.js - 메인 애플리케이션 로직

import { storage } from './storage.js';
import { nutritionAnalyzer } from './nutrition.js';
import { geminiAPI } from './gemini.js';
import { imageEnhancer } from './nanobanana.js';

class FoodAIApp {
    constructor() {
        this.currentImage = null;
        this.currentAnalysis = null;
        this.chart = null;
        this.macroChart = null;
        this.dailyChart = null;

        this.init();
    }

    async init() {
        // DOM이 로드된 후 초기화
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.setupEventListeners();
        this.loadInitialData();
        this.setupChart();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 탭 전환
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // 이미지 입력
        document.getElementById('camera-btn').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });

        document.getElementById('gallery-btn').addEventListener('click', () => {
            const input = document.getElementById('file-input');
            input.removeAttribute('capture');
            input.click();
        });

        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleImageSelect(e.target.files[0]);
        });

        // 분석 결과 액션
        document.getElementById('retry-btn').addEventListener('click', () => {
            this.retryAnalysis();
        });

        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveAnalysis();
        });

        // 설정 저장
        document.getElementById('save-settings-btn').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('save-api-key-btn').addEventListener('click', () => {
            this.saveApiKey();
        });

        document.getElementById('toggle-api-key').addEventListener('click', () => {
            this.toggleApiKeyVisibility();
        });

        // 데이터 관리
        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('clear-data-btn').addEventListener('click', () => {
            this.clearData();
        });

        // 통계 기간 선택
        document.querySelectorAll('.stats-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.updateStats(e.target.dataset.period);
            });
        });

        // AI 추천 받기
        document.getElementById('get-recommendation-btn').addEventListener('click', () => {
            this.getAIRecommendation();
        });

        // 간헐적 단식
        document.getElementById('fasting-toggle').addEventListener('change', (e) => {
            this.toggleFastingMode(e.target.checked);
        });

        document.getElementById('start-fasting-btn').addEventListener('click', () => {
            this.startFasting();
        });

        document.getElementById('toggle-fasting-btn').addEventListener('click', () => {
            this.toggleFastingState();
        });

        document.getElementById('end-fasting-btn').addEventListener('click', () => {
            this.endFasting();
        });

        // 메뉴 비교 재분석
        document.getElementById('retry-menu-btn').addEventListener('click', () => {
            this.analyzeMultipleFoods();
        });
    }

    // 초기 데이터 로드
    loadInitialData() {
        // API 키 로드
        const apiKey = storage.getApiKey();
        if (apiKey) {
            geminiAPI.setApiKey(apiKey);
            document.getElementById('api-key-input').value = apiKey;
            document.getElementById('api-status').textContent = '✓ 저장됨';
            document.getElementById('api-status').className = 'api-status saved';
        }

        // 설정 로드
        const settings = storage.getSettings();
        if (settings) {
            document.getElementById('gender-select').value = settings.gender || 'male';
            document.getElementById('age-input').value = settings.age || 25;
            document.getElementById('height-input').value = settings.height || 170;
            document.getElementById('weight-input').value = settings.weight || 70;
            document.getElementById('activity-select').value = settings.activity || 'moderate';
            document.getElementById('goal-select').value = settings.goal || 'maintain';
            document.getElementById('target-calories-input').value = settings.targetCalories || 2000;
        }

        // 홈 화면 업데이트
        this.updateHomeScreen();

        // 데이터 관리 정보 업데이트
        this.updateDataInfo();
    }

    // 탭 전환
    switchTab(tabName) {
        // 모든 탭 비활성화
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // 선택된 탭 활성화
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // 통계 탭이면 차트 업데이트
        if (tabName === 'stats') {
            this.updateStats('daily');
        }
    }

    // 이미지 선택 처리
    async handleImageSelect(file) {
        if (!file || !file.type.startsWith('image/')) {
            this.showToast('이미지 파일을 선택해주세요.');
            return;
        }

        // API 키 확인
        if (!geminiAPI.isReady()) {
            this.showToast('설정에서 Gemini API 키를 먼저 입력해주세요.');
            this.switchTab('settings');
            return;
        }

        // 분석 모드 확인
        const mode = document.querySelector('input[name="analysis-mode"]:checked').value;

        try {
            this.showLoading('이미지 분석 준비 중...');

            // 이미지 저장
            this.currentImage = file;

            // 이미지 표시
            const imageUrl = URL.createObjectURL(file);

            // 분석 탭으로 전환
            this.switchTab('analyze');

            if (mode === 'multiple') {
                // 메뉴판 다중 분석
                document.getElementById('menu-image').src = imageUrl;
                document.getElementById('menu-comparison').classList.remove('hidden');
                document.getElementById('single-analysis').classList.add('hidden');
                await this.analyzeMultipleFoods();
            } else {
                // 단일 음식 분석
                document.getElementById('food-image').src = imageUrl;
                document.getElementById('single-analysis').classList.remove('hidden');
                document.getElementById('menu-comparison').classList.add('hidden');
                await this.analyzeImage();
            }

        } catch (error) {
            console.error('Image processing error:', error);
            this.showToast('이미지 처리 중 오류가 발생했습니다.');
            this.hideLoading();
        }
    }

    // 이미지 분석
    async analyzeImage() {
        try {
            this.showLoading('AI가 음식을 분석 중입니다...');

            // Gemini API로 분석
            const analysis = await geminiAPI.analyzeFoodImage(this.currentImage);

            this.currentAnalysis = analysis;

            // 결과 표시
            this.displayAnalysisResult(analysis);

            this.hideLoading();
            this.showToast('분석이 완료되었습니다!');

        } catch (error) {
            console.error('Analysis error:', error);
            this.hideLoading();
            this.showToast(geminiAPI.translateError(error));
        }
    }

    // 분석 결과 표시
    displayAnalysisResult(analysis) {
        // 숨김 해제
        document.getElementById('no-analysis').classList.add('hidden');
        document.getElementById('analysis-result').classList.remove('hidden');

        // 음식 정보 입력
        document.getElementById('food-name-input').value = analysis.name;
        document.getElementById('calories-input').value = analysis.calories;
        document.getElementById('carbs-input').value = analysis.carbs;
        document.getElementById('protein-input').value = analysis.protein;
        document.getElementById('fat-input').value = analysis.fat;
        document.getElementById('sodium-input').value = analysis.sodium;

        // 운동량 환산
        const settings = storage.getSettings();
        const exercises = nutritionAnalyzer.calculateExerciseDuration(
            analysis.calories,
            settings.weight || 70
        );

        const exerciseList = document.getElementById('exercise-list');
        exerciseList.innerHTML = exercises.map(ex => `
            <div class="exercise-item">
                <span class="exercise-name">${ex.icon} ${ex.name}</span>
                <span class="exercise-time">${ex.duration}${ex.unit}</span>
            </div>
        `).join('');

        // 영양 그래프 표시
        this.updateNutritionCharts(analysis);

        // AI 영양 조언 생성
        this.generateAIAdvice(analysis);
    }

    // 영양 그래프 업데이트
    updateNutritionCharts(analysis) {
        // 3대 영양소 비율 차트 (도넛)
        this.updateMacroChart(analysis);

        // 일일 권장량 대비 차트 (막대)
        this.updateDailyChart(analysis);
    }

    // 3대 영양소 비율 차트
    updateMacroChart(analysis) {
        const ctx = document.getElementById('macro-chart');
        if (!ctx) return;

        // 기존 차트 삭제
        if (this.macroChart) {
            this.macroChart.destroy();
        }

        // 칼로리 계산
        const carbsCal = analysis.carbs * 4;
        const proteinCal = analysis.protein * 4;
        const fatCal = analysis.fat * 9;
        const total = carbsCal + proteinCal + fatCal;

        // 비율 계산
        const carbsPercent = total > 0 ? Math.round((carbsCal / total) * 100) : 0;
        const proteinPercent = total > 0 ? Math.round((proteinCal / total) * 100) : 0;
        const fatPercent = total > 0 ? Math.round((fatCal / total) * 100) : 0;

        this.macroChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['탄수화물', '단백질', '지방'],
                datasets: [{
                    data: [carbsPercent, proteinPercent, fatPercent],
                    backgroundColor: [
                        '#FF9500',  // 주황색 - 탄수화물
                        '#007AFF',  // 파란색 - 단백질
                        '#FF3B30'   // 빨간색 - 지방
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 13,
                                weight: '500'
                            },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    // 일일 권장량 대비 차트
    updateDailyChart(analysis) {
        const ctx = document.getElementById('daily-chart');
        if (!ctx) return;

        // 기존 차트 삭제
        if (this.dailyChart) {
            this.dailyChart.destroy();
        }

        // 일일 권장량 (2000kcal 기준)
        const daily = {
            calories: 2000,
            carbs: 300,
            protein: 50,
            fat: 65
        };

        // 비율 계산
        const caloriesPercent = Math.min((analysis.calories / daily.calories) * 100, 100);
        const carbsPercent = Math.min((analysis.carbs / daily.carbs) * 100, 100);
        const proteinPercent = Math.min((analysis.protein / daily.protein) * 100, 100);
        const fatPercent = Math.min((analysis.fat / daily.fat) * 100, 100);

        this.dailyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['칼로리', '탄수화물', '단백질', '지방'],
                datasets: [{
                    label: '섭취량 (%)',
                    data: [
                        Math.round(caloriesPercent),
                        Math.round(carbsPercent),
                        Math.round(proteinPercent),
                        Math.round(fatPercent)
                    ],
                    backgroundColor: [
                        'rgba(0, 122, 255, 0.8)',
                        'rgba(255, 149, 0, 0.8)',
                        'rgba(52, 199, 89, 0.8)',
                        'rgba(255, 59, 48, 0.8)'
                    ],
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return '일일 권장량의 ' + context.parsed.x + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    // 분석 재시도
    async retryAnalysis() {
        if (!this.currentImage) {
            this.showToast('이미지를 먼저 선택해주세요.');
            return;
        }

        await this.analyzeImage();
    }

    // 분석 결과 저장
    saveAnalysis() {
        if (!this.currentAnalysis) {
            this.showToast('저장할 분석 결과가 없습니다.');
            return;
        }

        // 사용자가 수정한 값 가져오기
        const meal = {
            name: document.getElementById('food-name-input').value,
            calories: parseInt(document.getElementById('calories-input').value) || 0,
            carbs: parseFloat(document.getElementById('carbs-input').value) || 0,
            protein: parseFloat(document.getElementById('protein-input').value) || 0,
            fat: parseFloat(document.getElementById('fat-input').value) || 0,
            sodium: parseFloat(document.getElementById('sodium-input').value) || 0,
            mealType: nutritionAnalyzer.getMealType()
        };

        // 업적과 함께 저장
        const { mealData, newBadges } = storage.saveMealWithAchievements(meal);

        // 새로운 배지 알림
        if (newBadges && newBadges.length > 0) {
            newBadges.forEach(badge => {
                this.showToast(`🎉 새 배지 획득: ${badge.icon} ${badge.name}`, 4000);
            });
        }

        // 홈 화면 업데이트
        this.updateHomeScreen();

        // 홈으로 이동
        this.switchTab('home');

        this.showToast('식사 기록이 저장되었습니다!');

        // 분석 결과 초기화
        this.currentAnalysis = null;
        this.currentImage = null;
    }

    // 홈 화면 업데이트
    updateHomeScreen() {
        // 스트릭 표시
        const streak = storage.getCurrentStreak();
        document.getElementById('streak-days').textContent = streak;

        // 주간 영양 점수 표시
        const weeklyScore = storage.calculateWeeklyNutritionScore();
        document.getElementById('nutrition-score').textContent = weeklyScore.score;

        // 점수에 따라 색상 변경
        const scoreCircle = document.getElementById('nutrition-score-circle');
        if (weeklyScore.score >= 80) {
            scoreCircle.style.borderColor = 'rgba(52, 199, 89, 0.8)';
        } else if (weeklyScore.score >= 60) {
            scoreCircle.style.borderColor = 'rgba(255, 149, 0, 0.8)';
        } else {
            scoreCircle.style.borderColor = 'rgba(255, 59, 48, 0.8)';
        }

        // 배지 표시
        this.updateBadges();

        // 간헐적 단식 카드 표시
        const fastingSettings = storage.getFastingSettings();
        document.getElementById('fasting-card').style.display = 'block';
        document.getElementById('fasting-toggle').checked = fastingSettings.enabled;

        if (fastingSettings.enabled) {
            this.updateFastingTimer();
        }

        // 오늘의 칼로리
        const todayCalories = storage.getTodayCalories();
        const targetCalories = storage.getSettings().targetCalories || 2000;

        document.getElementById('today-calories').textContent = todayCalories;
        document.getElementById('target-calories').textContent = targetCalories;

        // 진행률
        const progress = Math.min((todayCalories / targetCalories) * 100, 100);
        document.getElementById('calorie-progress').style.width = `${progress}%`;

        // 남은 칼로리
        const remaining = targetCalories - todayCalories;
        const remainingText = remaining > 0
            ? `목표까지 ${remaining} kcal 남음`
            : `목표를 ${-remaining} kcal 초과했습니다`;
        document.getElementById('remaining-text').textContent = remainingText;

        // AI 추천 카드 표시/숨김
        const recommendationCard = document.getElementById('recommendation-card');
        if (todayCalories > 0 && remaining > 0) {
            recommendationCard.style.display = 'block';
            document.getElementById('remaining-calories').textContent = remaining;
        } else {
            recommendationCard.style.display = 'none';
        }

        // 최근 식사 기록
        this.updateRecentMeals();
    }

    // 최근 식사 기록 업데이트
    updateRecentMeals() {
        const meals = storage.getTodayMeals().slice(0, 5);
        const container = document.getElementById('recent-meals');

        if (meals.length === 0) {
            container.innerHTML = '<p class="empty-message">아직 기록이 없습니다. 첫 식사를 분석해보세요!</p>';
            return;
        }

        container.innerHTML = meals.map(meal => {
            const emoji = nutritionAnalyzer.getFoodEmoji(meal.name);
            const time = new Date(meal.timestamp).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="meal-item">
                    <div class="meal-info">
                        <div class="meal-name">${emoji} ${meal.mealType}: ${meal.name}</div>
                        <div class="meal-time">${time}</div>
                    </div>
                    <div class="meal-calories">${meal.calories} kcal</div>
                </div>
            `;
        }).join('');
    }

    // 차트 설정
    setupChart() {
        const ctx = document.getElementById('calorie-chart');
        if (!ctx) return;

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '칼로리',
                    data: [],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value + ' kcal'
                        }
                    }
                }
            }
        });
    }

    // 통계 업데이트
    updateStats(period) {
        // 버튼 활성화
        document.querySelectorAll('.stats-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === period);
        });

        // 통계 데이터 가져오기
        const stats = storage.getStatsByPeriod(period);
        const entries = Object.entries(stats).sort();

        // 최근 데이터만 표시
        const limit = period === 'daily' ? 7 : period === 'weekly' ? 4 : 6;
        const recent = entries.slice(-limit);

        // 차트 업데이트
        if (this.chart) {
            this.chart.data.labels = recent.map(([key]) => {
                if (period === 'daily') {
                    const date = new Date(key);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                } else if (period === 'weekly') {
                    return `${key} 주`;
                } else {
                    return key;
                }
            });

            this.chart.data.datasets[0].data = recent.map(([, data]) => data.calories);
            this.chart.update();
        }

        // 통계 요약
        const allCalories = recent.map(([, data]) => data.calories);
        if (allCalories.length > 0) {
            const avg = Math.round(allCalories.reduce((a, b) => a + b, 0) / allCalories.length);
            const max = Math.max(...allCalories);
            const min = Math.min(...allCalories);

            document.getElementById('avg-calories').textContent = `${avg} kcal`;
            document.getElementById('max-calories').textContent = `${max} kcal`;
            document.getElementById('min-calories').textContent = `${min} kcal`;
        }

        // 주요 음식
        this.updateTopFoods();
    }

    // 주요 음식 업데이트
    updateTopFoods() {
        const topFoods = storage.getTopFoods(5);
        const container = document.getElementById('top-foods');

        if (topFoods.length === 0) {
            container.innerHTML = '<p class="empty-message">아직 데이터가 없습니다.</p>';
            return;
        }

        const total = topFoods.reduce((sum, food) => sum + food.count, 0);

        container.innerHTML = topFoods.map((food, index) => {
            const percentage = Math.round((food.count / total) * 100);
            const emoji = nutritionAnalyzer.getFoodEmoji(food.name);

            return `
                <div class="top-food-item">
                    <div class="food-rank">${index + 1}위</div>
                    <div class="food-details">
                        <div>${emoji} ${food.name}</div>
                        <small>${food.count}회 · ${food.calories} kcal</small>
                    </div>
                    <div class="food-percentage">${percentage}%</div>
                </div>
            `;
        }).join('');
    }

    // 설정 저장
    saveSettings() {
        const settings = {
            gender: document.getElementById('gender-select').value,
            age: parseInt(document.getElementById('age-input').value) || 25,
            height: parseInt(document.getElementById('height-input').value) || 170,
            weight: parseInt(document.getElementById('weight-input').value) || 70,
            activity: document.getElementById('activity-select').value,
            goal: document.getElementById('goal-select').value,
            targetCalories: parseInt(document.getElementById('target-calories-input').value) || 2000
        };

        storage.saveSettings(settings);
        this.updateHomeScreen();
        this.showToast('설정이 저장되었습니다.');
    }

    // API 키 저장
    saveApiKey() {
        const apiKey = document.getElementById('api-key-input').value.trim();

        if (!apiKey) {
            this.showToast('API 키를 입력해주세요.');
            return;
        }

        storage.saveApiKey(apiKey);
        geminiAPI.setApiKey(apiKey);

        document.getElementById('api-status').textContent = '✓ 저장됨';
        document.getElementById('api-status').className = 'api-status saved';

        this.showToast('API 키가 저장되었습니다.');
    }

    // API 키 표시/숨김
    toggleApiKeyVisibility() {
        const input = document.getElementById('api-key-input');
        input.type = input.type === 'password' ? 'text' : 'password';
    }

    // 데이터 내보내기
    exportData() {
        const data = storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `foodai_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
        this.showToast('데이터가 내보내기되었습니다.');
    }

    // 데이터 삭제
    clearData() {
        if (!confirm('모든 식사 기록을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
            return;
        }

        storage.clearAllData();
        this.updateHomeScreen();
        this.updateDataInfo();
        this.showToast('모든 데이터가 삭제되었습니다.');
    }

    // 데이터 정보 업데이트
    updateDataInfo() {
        document.getElementById('meal-count').textContent = storage.getMealCount();
        document.getElementById('storage-size').textContent = storage.getStorageSize();
    }

    // 로딩 표시
    showLoading(message = 'Loading...') {
        const loading = document.getElementById('loading');
        loading.querySelector('p').textContent = message;
        loading.classList.remove('hidden');
    }

    // 로딩 숨김
    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    // Toast 알림
    showToast(message, duration = 3000) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    // AI 영양 조언 생성
    async generateAIAdvice(analysis) {
        const adviceContainer = document.getElementById('ai-advice');
        adviceContainer.innerHTML = '<div class="advice-loading">AI가 맞춤 조언을 생성하는 중...</div>';

        try {
            const settings = storage.getSettings();
            const todayCalories = storage.getTodayCalories();
            const targetCalories = settings.targetCalories || 2000;

            const prompt = `다음 음식에 대해 한국어로 영양 조언을 해주세요:

음식: ${analysis.name}
칼로리: ${analysis.calories} kcal
탄수화물: ${analysis.carbs}g
단백질: ${analysis.protein}g
지방: ${analysis.fat}g
나트륨: ${analysis.sodium}mg

사용자 정보:
- 오늘 이미 섭취한 칼로리: ${todayCalories} kcal
- 목표 칼로리: ${targetCalories} kcal
- 목표: ${settings.goal === 'lose' ? '체중 감량' : settings.goal === 'gain' ? '체중 증가' : '체중 유지'}

다음 형식으로 3-4문장으로 간단히 조언해주세요:
1. 이 음식의 영양적 특징
2. 현재 섭취 상태에서의 평가
3. 개선 제안 (있다면)

친근하고 격려하는 톤으로 작성해주세요.`;

            const advice = await geminiAPI.analyzeText(prompt);

            // 조언 표시
            const paragraphs = advice.split('\n\n').filter(p => p.trim());
            adviceContainer.innerHTML = paragraphs.map(p => {
                const cleaned = p.trim().replace(/^[\d\.\-\*]+\s*/, '');
                return `<p>${cleaned}</p>`;
            }).join('');

        } catch (error) {
            console.error('AI advice error:', error);
            adviceContainer.innerHTML = '<p>AI 조언 생성에 실패했습니다. 다음에 다시 시도해주세요.</p>';
        }
    }

    // AI 추천 메뉴 생성
    async getAIRecommendation() {
        if (!geminiAPI.isReady()) {
            this.showToast('설정에서 Gemini API 키를 먼저 입력해주세요.');
            this.switchTab('settings');
            return;
        }

        const recommendationContainer = document.getElementById('ai-recommendation');
        recommendationContainer.innerHTML = '<div class="recommendation-loading">AI가 맞춤 메뉴를 추천하는 중...</div>';

        try {
            const settings = storage.getSettings();
            const todayCalories = storage.getTodayCalories();
            const targetCalories = settings.targetCalories || 2000;
            const remaining = targetCalories - todayCalories;

            const todayMeals = storage.getTodayMeals();
            const mealSummary = todayMeals.map(m => `${m.name} (${m.calories}kcal)`).join(', ');

            const prompt = `다음 상황에서 저녁 식사로 적합한 메뉴 3가지를 추천해주세요:

남은 칼로리: ${remaining} kcal
오늘 먹은 음식: ${mealSummary || '없음'}
목표: ${settings.goal === 'lose' ? '체중 감량' : settings.goal === 'gain' ? '체중 증가' : '체중 유지'}

각 추천 메뉴에 대해 다음 형식으로 작성해주세요:
[음식명] | [예상 칼로리] | [한 줄 설명]

예시:
연어 샐러드 | 450kcal | 단백질이 풍부하고 오메가3가 많아 건강한 저녁 식사입니다
닭가슴살 도시락 | 550kcal | 고단백 저칼로리로 다이어트에 완벽합니다
두부 김치찌개 | 400kcal | 칼로리는 낮지만 포만감이 높은 한식 메뉴입니다

3개만 추천해주세요.`;

            const response = await geminiAPI.analyzeText(prompt);

            // 추천 메뉴 파싱
            const lines = response.split('\n').filter(line => line.includes('|'));

            if (lines.length > 0) {
                const recommendations = lines.slice(0, 3).map(line => {
                    const parts = line.split('|').map(p => p.trim());
                    return {
                        name: parts[0] || '추천 메뉴',
                        calories: parts[1] || '0kcal',
                        desc: parts[2] || '건강한 식사입니다'
                    };
                });

                recommendationContainer.innerHTML = recommendations.map(rec => {
                    const emoji = nutritionAnalyzer.getFoodEmoji(rec.name);
                    return `
                        <div class="recommendation-item">
                            <div class="recommendation-emoji">${emoji}</div>
                            <div class="recommendation-details">
                                <div class="recommendation-name">${rec.name}</div>
                                <div class="recommendation-desc">${rec.desc}</div>
                            </div>
                            <div class="recommendation-calories">${rec.calories}</div>
                        </div>
                    `;
                }).join('');
            } else {
                recommendationContainer.innerHTML = '<p>추천 메뉴를 생성할 수 없습니다. 다시 시도해주세요.</p>';
            }

        } catch (error) {
            console.error('AI recommendation error:', error);
            recommendationContainer.innerHTML = '<p>추천 메뉴 생성에 실패했습니다. API 키를 확인해주세요.</p>';
            this.showToast(geminiAPI.translateError(error));
        }
    }

    // 배지 표시 업데이트
    updateBadges() {
        const badges = storage.getBadges();
        const container = document.getElementById('badges-container');

        if (badges.length === 0) {
            container.innerHTML = '<p class="empty-message">아직 획득한 배지가 없습니다. 첫 배지를 획득해보세요!</p>';
            return;
        }

        container.innerHTML = badges.map(badge => {
            const earnedDate = new Date(badge.earnedAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            return `
                <div class="badge-item">
                    <div class="badge-icon">${badge.icon}</div>
                    <div class="badge-name">${badge.name}</div>
                    <div class="badge-desc">${badge.desc}</div>
                    <div class="badge-date">${earnedDate}</div>
                </div>
            `;
        }).join('');
    }

    // 간헐적 단식 모드 토글
    toggleFastingMode(enabled) {
        storage.saveFastingSettings({ enabled });

        const timerEl = document.getElementById('fasting-timer');
        const setupEl = document.getElementById('fasting-setup');

        if (enabled) {
            timerEl.classList.remove('hidden');
            setupEl.style.display = 'none';
            this.startFastingTimerUpdate();
        } else {
            timerEl.classList.add('hidden');
            setupEl.style.display = 'flex';
            this.stopFastingTimerUpdate();
        }
    }

    // 단식 시작
    startFasting() {
        const mode = document.getElementById('fasting-mode-select').value;
        storage.saveFastingSettings({ mode });
        storage.startFasting();

        document.getElementById('fasting-timer').classList.remove('hidden');
        document.getElementById('fasting-setup').style.display = 'none';

        this.updateFastingTimer();
        this.startFastingTimerUpdate();
        this.showToast('간헐적 단식을 시작했습니다!');
    }

    // 단식/식사 상태 전환
    toggleFastingState() {
        const status = storage.getFastingStatus();

        if (status.status === 'fasting') {
            storage.startEating();
            this.showToast('식사 시간이 시작되었습니다!');
        } else {
            storage.startFasting();
            this.showToast('단식이 시작되었습니다!');
        }

        this.updateFastingTimer();
    }

    // 단식 종료
    endFasting() {
        if (!confirm('간헐적 단식을 중단하시겠습니까?')) {
            return;
        }

        storage.endFasting();
        this.updateFastingTimer();
        this.showToast('간헐적 단식을 중단했습니다.');
    }

    // 간헐적 단식 타이머 업데이트
    updateFastingTimer() {
        const status = storage.getFastingStatus();

        if (!status.enabled || status.status === 'idle') {
            document.getElementById('fasting-timer').classList.add('hidden');
            document.getElementById('fasting-setup').style.display = 'flex';
            return;
        }

        document.getElementById('fasting-timer').classList.remove('hidden');
        document.getElementById('fasting-setup').style.display = 'none';

        // 모드 표시
        document.getElementById('fasting-mode').textContent = `${status.mode} 모드`;

        // 상태 표시
        const stateText = status.status === 'fasting' ? '단식 중' : '식사 시간';
        document.getElementById('fasting-state').textContent = stateText;

        // 시간 표시
        document.getElementById('fasting-hours').textContent = status.elapsedHours || 0;
        document.getElementById('fasting-minutes').textContent = String(status.elapsedMinutes || 0).padStart(2, '0');

        // 진행률 표시
        document.getElementById('fasting-progress').style.width = `${status.progress || 0}%`;

        // 버튼 텍스트
        const toggleBtn = document.getElementById('toggle-fasting-btn');
        toggleBtn.textContent = status.status === 'fasting' ? '식사 시작' : '단식 시작';

        // 완료 체크
        if (status.status === 'fasting' && status.isCompleted) {
            this.showToast('🎉 단식 목표를 달성했습니다!', 5000);
        }
    }

    // 단식 타이머 자동 업데이트 시작
    startFastingTimerUpdate() {
        this.stopFastingTimerUpdate();
        this.fastingInterval = setInterval(() => {
            this.updateFastingTimer();
        }, 60000); // 1분마다 업데이트
    }

    // 단식 타이머 자동 업데이트 중지
    stopFastingTimerUpdate() {
        if (this.fastingInterval) {
            clearInterval(this.fastingInterval);
            this.fastingInterval = null;
        }
    }

    // 여러 음식 동시 분석 (메뉴판 스캔)
    async analyzeMultipleFoods() {
        try {
            this.showLoading('AI가 메뉴판을 분석 중입니다...');

            // Gemini API로 다중 음식 분석
            const foods = await geminiAPI.analyzeMultipleFoods(this.currentImage);

            if (!foods || foods.length === 0) {
                throw new Error('음식을 인식할 수 없습니다.');
            }

            // 사용자 정보로 각 메뉴 평가
            const settings = storage.getSettings();
            const targetCalories = settings.targetCalories || 2000;
            const todayCalories = storage.getTodayCalories();
            const remaining = targetCalories - todayCalories;

            // 각 메뉴에 점수 부여
            const evaluatedFoods = foods.map(food => {
                const pros = [];
                const cons = [];
                let score = 50;
                let badge = null;

                // 칼로리 평가
                if (food.calories <= remaining * 0.4) {
                    pros.push('남은 칼로리에 적합');
                    score += 20;
                } else if (food.calories > remaining) {
                    cons.push('남은 칼로리 초과');
                    score -= 20;
                }

                // 단백질 평가
                if (food.protein >= 20) {
                    pros.push('단백질 풍부');
                    score += 15;
                } else if (food.protein < 10) {
                    cons.push('단백질 부족');
                    score -= 10;
                }

                // 지방 평가
                const fatRatio = (food.fat * 9) / food.calories;
                if (fatRatio < 0.3) {
                    pros.push('저지방 식단');
                    score += 10;
                } else if (fatRatio > 0.4) {
                    cons.push('지방 함량 높음');
                    score -= 10;
                }

                // 나트륨 평가
                if (food.sodium < 500) {
                    pros.push('저염식');
                    score += 10;
                } else if (food.sodium > 1000) {
                    cons.push('나트륨 과다');
                    score -= 15;
                }

                // 배지 부여
                if (score >= 80) {
                    badge = 'best';
                } else if (score >= 60) {
                    badge = 'good';
                } else if (score < 40) {
                    badge = 'caution';
                }

                return {
                    ...food,
                    pros,
                    cons,
                    score,
                    badge
                };
            });

            // 점수순 정렬
            evaluatedFoods.sort((a, b) => b.score - a.score);

            // UI에 표시
            this.displayMenuComparison(evaluatedFoods, remaining);

            this.hideLoading();
            this.showToast(`${foods.length}개 메뉴를 분석했습니다!`);

        } catch (error) {
            console.error('Multiple foods analysis error:', error);
            this.hideLoading();
            this.showToast(geminiAPI.translateError(error));
        }
    }

    // 메뉴 비교 UI 표시
    displayMenuComparison(foods, remainingCalories) {
        // AI 추천 요약
        const best = foods[0];
        const summaryHTML = `
            <h3>🤖 AI 추천</h3>
            <p><strong>${best.name}</strong>이(가) 가장 적합합니다!</p>
            <p>${best.calories}kcal로 남은 칼로리 ${remainingCalories}kcal에 딱 맞고, ${best.pros.join(', ')} 특징이 있습니다.</p>
        `;
        document.getElementById('ai-recommendation-summary').innerHTML = summaryHTML;

        // 메뉴 카드 생성
        const gridHTML = foods.map((food, index) => {
            const badgeText = food.badge === 'best' ? 'BEST' : food.badge === 'good' ? 'GOOD' : food.badge === 'caution' ? '주의' : '';
            const badgeClass = food.badge || '';
            const cardClass = index === 0 ? 'recommended' : food.badge === 'caution' ? 'danger' : '';

            return `
                <div class="menu-item-card ${cardClass}">
                    ${badgeText ? `<div class="menu-badge ${badgeClass}">${badgeText}</div>` : ''}

                    <div class="menu-item-name">${food.name}</div>
                    <div class="menu-item-calories">${food.calories} <span style="font-size: 16px; font-weight: 500;">kcal</span></div>

                    <div class="menu-item-nutrients">
                        <div class="nutrient-chip">
                            <span class="nutrient-label">탄수화물</span>
                            <span class="nutrient-value">${food.carbs}g</span>
                        </div>
                        <div class="nutrient-chip">
                            <span class="nutrient-label">단백질</span>
                            <span class="nutrient-value">${food.protein}g</span>
                        </div>
                        <div class="nutrient-chip">
                            <span class="nutrient-label">지방</span>
                            <span class="nutrient-value">${food.fat}g</span>
                        </div>
                    </div>

                    ${food.pros.length > 0 ? `
                        <div class="menu-item-pros">
                            <div class="pros-title">✅ 장점</div>
                            <ul class="pros-list">
                                ${food.pros.map(pro => `<li>• ${pro}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${food.cons.length > 0 ? `
                        <div class="menu-item-cons">
                            <div class="cons-title">⚠️ 단점</div>
                            <ul class="cons-list">
                                ${food.cons.map(con => `<li>• ${con}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    <button class="select-menu-btn" onclick="foodAI.selectMenu(${index})">
                        이 메뉴 선택
                    </button>
                </div>
            `;
        }).join('');

        document.getElementById('menu-items-grid').innerHTML = gridHTML;

        // 현재 메뉴 목록 저장
        this.currentMenus = foods;
    }

    // 메뉴 선택
    selectMenu(index) {
        const selectedFood = this.currentMenus[index];

        this.showToast(`${selectedFood.name}를 선택했습니다!`);

        // 단일 분석 모드로 전환하여 상세 정보 표시
        this.currentAnalysis = selectedFood;
        this.displayAnalysisResult(selectedFood);

        // UI 전환
        document.getElementById('single-analysis').classList.remove('hidden');
        document.getElementById('menu-comparison').classList.add('hidden');
    }
}

// 앱 초기화
const app = new FoodAIApp();

// 전역으로 export (디버깅용)
window.foodAI = app;
