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

        try {
            this.showLoading('이미지 분석 준비 중...');

            // 이미지 저장
            this.currentImage = file;

            // 이미지 표시
            const imageUrl = URL.createObjectURL(file);
            document.getElementById('food-image').src = imageUrl;

            // 분석 탭으로 전환
            this.switchTab('analyze');

            // AI 분석 시작
            await this.analyzeImage();

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

        // 저장
        storage.saveMeal(meal);

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
}

// 앱 초기화
const app = new FoodAIApp();

// 전역으로 export (디버깅용)
window.foodAI = app;
