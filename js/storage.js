// storage.js - 로컬스토리지 관리 모듈

export class StorageManager {
    constructor() {
        this.KEYS = {
            API_KEY: 'foodai_api_key',
            MEALS: 'foodai_meals',
            SETTINGS: 'foodai_settings',
            USER_INFO: 'foodai_user_info',
            BADGES: 'foodai_badges',
            ACHIEVEMENTS: 'foodai_achievements',
            FASTING: 'foodai_fasting'
        };
        this.initDefaults();
        this.initBadges();
        this.initFasting();
    }

    // 기본값 초기화
    initDefaults() {
        if (!this.getSettings()) {
            this.saveSettings({
                targetCalories: 2000,
                goal: 'maintain',
                gender: 'male',
                age: 25,
                height: 170,
                weight: 70,
                activity: 'moderate'
            });
        }
    }

    // API 키 저장/불러오기
    saveApiKey(apiKey) {
        localStorage.setItem(this.KEYS.API_KEY, apiKey);
    }

    getApiKey() {
        return localStorage.getItem(this.KEYS.API_KEY);
    }

    hasApiKey() {
        return !!this.getApiKey();
    }

    // 설정 저장/불러오기
    saveSettings(settings) {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    }

    getSettings() {
        const data = localStorage.getItem(this.KEYS.SETTINGS);
        return data ? JSON.parse(data) : null;
    }

    // 사용자 정보 업데이트
    updateUserInfo(info) {
        const settings = this.getSettings();
        const updated = { ...settings, ...info };
        this.saveSettings(updated);
    }

    // 식사 기록 저장
    saveMeal(meal) {
        const meals = this.getMeals();
        const mealData = {
            ...meal,
            id: Date.now(),
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0]
        };
        meals.unshift(mealData);
        localStorage.setItem(this.KEYS.MEALS, JSON.stringify(meals));
        return mealData;
    }

    // 모든 식사 기록 불러오기
    getMeals() {
        const data = localStorage.getItem(this.KEYS.MEALS);
        return data ? JSON.parse(data) : [];
    }

    // 특정 날짜의 식사 기록
    getMealsByDate(date) {
        const meals = this.getMeals();
        return meals.filter(meal => meal.date === date);
    }

    // 오늘의 식사 기록
    getTodayMeals() {
        const today = new Date().toISOString().split('T')[0];
        return this.getMealsByDate(today);
    }

    // 오늘의 총 칼로리
    getTodayCalories() {
        const todayMeals = this.getTodayMeals();
        return todayMeals.reduce((total, meal) => total + (meal.calories || 0), 0);
    }

    // 최근 N일의 식사 기록
    getRecentMeals(days = 7) {
        const meals = this.getMeals();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];

        return meals.filter(meal => meal.date >= cutoffStr);
    }

    // 날짜 범위의 통계
    getStatsByPeriod(period = 'daily') {
        const meals = this.getMeals();
        const stats = {};

        meals.forEach(meal => {
            let key;
            const date = new Date(meal.date);

            if (period === 'daily') {
                key = meal.date;
            } else if (period === 'weekly') {
                // 주의 시작(일요일)을 키로 사용
                const day = date.getDay();
                const startOfWeek = new Date(date);
                startOfWeek.setDate(date.getDate() - day);
                key = startOfWeek.toISOString().split('T')[0];
            } else if (period === 'monthly') {
                key = meal.date.substring(0, 7); // YYYY-MM
            }

            if (!stats[key]) {
                stats[key] = { calories: 0, count: 0, meals: [] };
            }
            stats[key].calories += meal.calories || 0;
            stats[key].count++;
            stats[key].meals.push(meal);
        });

        return stats;
    }

    // 주요 음식 통계
    getTopFoods(limit = 5) {
        const meals = this.getMeals();
        const foodCounts = {};

        meals.forEach(meal => {
            const name = meal.name || '알 수 없는 음식';
            if (!foodCounts[name]) {
                foodCounts[name] = { count: 0, calories: 0 };
            }
            foodCounts[name].count++;
            foodCounts[name].calories += meal.calories || 0;
        });

        const sorted = Object.entries(foodCounts)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        return sorted;
    }

    // 식사 삭제
    deleteMeal(id) {
        const meals = this.getMeals();
        const filtered = meals.filter(meal => meal.id !== id);
        localStorage.setItem(this.KEYS.MEALS, JSON.stringify(filtered));
    }

    // 데이터 내보내기
    exportData() {
        const data = {
            meals: this.getMeals(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }

    // 데이터 가져오기
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.meals) {
                localStorage.setItem(this.KEYS.MEALS, JSON.stringify(data.meals));
            }
            if (data.settings) {
                localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(data.settings));
            }
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }

    // 모든 데이터 삭제
    clearAllData() {
        Object.values(this.KEYS).forEach(key => {
            if (key !== this.KEYS.API_KEY) {
                localStorage.removeItem(key);
            }
        });
        this.initDefaults();
    }

    // 저장소 크기 계산 (KB)
    getStorageSize() {
        let total = 0;
        Object.values(this.KEYS).forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                total += item.length * 2; // UTF-16 = 2 bytes per char
            }
        });
        return (total / 1024).toFixed(2);
    }

    // 식사 수 카운트
    getMealCount() {
        return this.getMeals().length;
    }

    // 주간 영양소 합계
    getWeeklyNutritionBalance() {
        const weeklyMeals = this.getRecentMeals(7);

        if (weeklyMeals.length === 0) {
            return null;
        }

        const total = {
            calories: 0,
            carbs: 0,
            protein: 0,
            fat: 0,
            sodium: 0,
            days: 0
        };

        // 날짜별로 그룹화
        const mealsByDate = {};
        weeklyMeals.forEach(meal => {
            if (!mealsByDate[meal.date]) {
                mealsByDate[meal.date] = [];
            }
            mealsByDate[meal.date].push(meal);
        });

        // 각 날짜별 합계
        Object.values(mealsByDate).forEach(dayMeals => {
            dayMeals.forEach(meal => {
                total.calories += meal.calories || 0;
                total.carbs += meal.carbs || 0;
                total.protein += meal.protein || 0;
                total.fat += meal.fat || 0;
                total.sodium += meal.sodium || 0;
            });
            total.days++;
        });

        return total;
    }

    // 주간 영양 균형 점수 계산 (0-100)
    calculateWeeklyNutritionScore() {
        const weeklyData = this.getWeeklyNutritionBalance();

        if (!weeklyData || weeklyData.days === 0) {
            return {
                score: 0,
                details: {
                    macroBalance: 0,
                    calorieConsistency: 0,
                    sodiumControl: 0,
                    proteinAdequacy: 0
                },
                feedback: []
            };
        }

        let score = 100;
        const feedback = [];
        const details = {};

        // 1. 3대 영양소 비율 평가 (40점)
        const totalCarbsCal = weeklyData.carbs * 4;
        const totalProteinCal = weeklyData.protein * 4;
        const totalFatCal = weeklyData.fat * 9;
        const totalMacroCal = totalCarbsCal + totalProteinCal + totalFatCal;

        if (totalMacroCal > 0) {
            const carbsRatio = (totalCarbsCal / totalMacroCal) * 100;
            const proteinRatio = (totalProteinCal / totalMacroCal) * 100;
            const fatRatio = (totalFatCal / totalMacroCal) * 100;

            let macroScore = 40;

            // 탄수화물: 이상 50-60%
            if (carbsRatio < 40 || carbsRatio > 70) {
                macroScore -= 15;
                if (carbsRatio > 70) feedback.push(`탄수화물 과다 ${Math.round(carbsRatio)}%`);
                if (carbsRatio < 40) feedback.push(`탄수화물 부족 ${Math.round(carbsRatio)}%`);
            }

            // 단백질: 이상 15-25%
            if (proteinRatio < 15) {
                macroScore -= 15;
                feedback.push(`단백질 부족 ${Math.round(proteinRatio)}%`);
            } else if (proteinRatio > 30) {
                macroScore -= 5;
            }

            // 지방: 이상 20-30%
            if (fatRatio > 35) {
                macroScore -= 10;
                feedback.push(`지방 과다 ${Math.round(fatRatio)}%`);
            } else if (fatRatio < 15) {
                macroScore -= 5;
            }

            details.macroBalance = Math.max(0, macroScore);
            score = score - 40 + details.macroBalance;
        }

        // 2. 칼로리 목표 달성 일관성 (30점)
        const settings = this.getSettings();
        const targetCalories = settings.targetCalories || 2000;
        const avgDailyCalories = weeklyData.calories / weeklyData.days;
        const calorieDeviation = Math.abs(avgDailyCalories - targetCalories) / targetCalories;

        let calorieScore = 30;
        if (calorieDeviation > 0.3) {
            calorieScore -= 20;
            feedback.push('목표 칼로리와 큰 차이');
        } else if (calorieDeviation > 0.15) {
            calorieScore -= 10;
        }

        details.calorieConsistency = calorieScore;
        score = score - 30 + calorieScore;

        // 3. 나트륨 조절 (20점)
        const avgDailySodium = weeklyData.sodium / weeklyData.days;
        let sodiumScore = 20;

        if (avgDailySodium > 2300) {
            sodiumScore -= 15;
            feedback.push(`나트륨 과다 (평균 ${Math.round(avgDailySodium)}mg/일)`);
        } else if (avgDailySodium > 1800) {
            sodiumScore -= 8;
        }

        details.sodiumControl = sodiumScore;
        score = score - 20 + sodiumScore;

        // 4. 단백질 충분성 (10점)
        const avgDailyProtein = weeklyData.protein / weeklyData.days;
        let proteinScore = 10;

        if (avgDailyProtein < 50) {
            proteinScore -= 8;
            feedback.push(`단백질 섭취 부족 (평균 ${Math.round(avgDailyProtein)}g/일)`);
        } else if (avgDailyProtein < 60) {
            proteinScore -= 4;
        }

        details.proteinAdequacy = proteinScore;
        score = score - 10 + proteinScore;

        return {
            score: Math.max(0, Math.min(100, Math.round(score))),
            details,
            feedback,
            weeklyData
        };
    }

    // 목표 칼로리 계산 (Harris-Benedict 공식)
    calculateTargetCalories(userInfo) {
        const { gender, age, height, weight, activity, goal } = userInfo;

        // BMR (기초대사량) 계산
        let bmr;
        if (gender === 'male') {
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }

        // 활동량 계수
        const activityMultipliers = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'very-active': 1.9
        };

        const tdee = bmr * (activityMultipliers[activity] || 1.55);

        // 목표에 따른 조정
        let targetCalories = tdee;
        if (goal === 'lose') {
            targetCalories -= 500; // 체중 감량: -500 kcal
        } else if (goal === 'gain') {
            targetCalories += 500; // 체중 증가: +500 kcal
        }

        return Math.round(targetCalories);
    }

    // 배지 초기화
    initBadges() {
        if (!localStorage.getItem(this.KEYS.BADGES)) {
            const initialBadges = [];
            localStorage.setItem(this.KEYS.BADGES, JSON.stringify(initialBadges));
        }

        if (!localStorage.getItem(this.KEYS.ACHIEVEMENTS)) {
            const initialAchievements = {
                streak: 0,
                maxStreak: 0,
                goalAchieved: 0,
                perfectWeeks: 0,
                vegetableDays: 0,
                proteinDays: 0
            };
            localStorage.setItem(this.KEYS.ACHIEVEMENTS, JSON.stringify(initialAchievements));
        }
    }

    // 배지 정의
    getBadgeDefinitions() {
        return {
            // 연속 기록 배지
            streak3: { id: 'streak3', name: '3일 연속', icon: '🔥', desc: '3일 연속 기록', threshold: 3 },
            streak7: { id: 'streak7', name: '일주일 마스터', icon: '🏅', desc: '7일 연속 기록', threshold: 7 },
            streak14: { id: 'streak14', name: '2주 달성', icon: '💪', desc: '14일 연속 기록', threshold: 14 },
            streak30: { id: 'streak30', name: '한 달 챔피언', icon: '🏆', desc: '30일 연속 기록', threshold: 30 },
            streak100: { id: 'streak100', name: '백일 장인', icon: '👑', desc: '100일 연속 기록', threshold: 100 },

            // 목표 달성 배지
            goal5: { id: 'goal5', name: '목표 시작', icon: '🎯', desc: '목표 칼로리 5회 달성', threshold: 5 },
            goal10: { id: 'goal10', name: '목표 초보', icon: '🎖️', desc: '목표 칼로리 10회 달성', threshold: 10 },
            goal30: { id: 'goal30', name: '목표 전문가', icon: '🥇', desc: '목표 칼로리 30회 달성', threshold: 30 },
            goal100: { id: 'goal100', name: '목표 달인', icon: '💎', desc: '목표 칼로리 100회 달성', threshold: 100 },

            // 영양 균형 배지
            perfect1: { id: 'perfect1', name: '완벽한 주간', icon: '⭐', desc: '주간 영양 점수 90점 이상', threshold: 1 },
            perfect3: { id: 'perfect3', name: '영양 마스터', icon: '🌟', desc: '완벽한 영양 균형 3회', threshold: 3 },
            perfect10: { id: 'perfect10', name: '영양 전문가', icon: '✨', desc: '완벽한 영양 균형 10회', threshold: 10 },

            // 특수 배지
            veggie5: { id: 'veggie5', name: '채소 마스터', icon: '🥗', desc: '5일 연속 채소 섭취', threshold: 5 },
            protein7: { id: 'protein7', name: '단백질 챔피언', icon: '💪', desc: '7일 연속 단백질 충분 섭취', threshold: 7 },
        };
    }

    // 배지 획득 체크 및 업데이트
    checkAndAwardBadges() {
        const achievements = this.getAchievements();
        const currentBadges = this.getBadges();
        const badgeDefs = this.getBadgeDefinitions();
        const newBadges = [];

        // 연속 기록 배지
        const streak = this.getCurrentStreak();
        ['streak3', 'streak7', 'streak14', 'streak30', 'streak100'].forEach(badgeId => {
            const badge = badgeDefs[badgeId];
            if (streak >= badge.threshold && !currentBadges.find(b => b.id === badgeId)) {
                newBadges.push({
                    ...badge,
                    earnedAt: new Date().toISOString()
                });
            }
        });

        // 목표 달성 배지
        ['goal5', 'goal10', 'goal30', 'goal100'].forEach(badgeId => {
            const badge = badgeDefs[badgeId];
            if (achievements.goalAchieved >= badge.threshold && !currentBadges.find(b => b.id === badgeId)) {
                newBadges.push({
                    ...badge,
                    earnedAt: new Date().toISOString()
                });
            }
        });

        // 영양 균형 배지
        ['perfect1', 'perfect3', 'perfect10'].forEach(badgeId => {
            const badge = badgeDefs[badgeId];
            if (achievements.perfectWeeks >= badge.threshold && !currentBadges.find(b => b.id === badgeId)) {
                newBadges.push({
                    ...badge,
                    earnedAt: new Date().toISOString()
                });
            }
        });

        // 채소 마스터 배지
        if (achievements.vegetableDays >= badgeDefs.veggie5.threshold &&
            !currentBadges.find(b => b.id === 'veggie5')) {
            newBadges.push({
                ...badgeDefs.veggie5,
                earnedAt: new Date().toISOString()
            });
        }

        // 단백질 챔피언 배지
        if (achievements.proteinDays >= badgeDefs.protein7.threshold &&
            !currentBadges.find(b => b.id === 'protein7')) {
            newBadges.push({
                ...badgeDefs.protein7,
                earnedAt: new Date().toISOString()
            });
        }

        // 새 배지 저장
        if (newBadges.length > 0) {
            const allBadges = [...currentBadges, ...newBadges];
            localStorage.setItem(this.KEYS.BADGES, JSON.stringify(allBadges));
        }

        return newBadges;
    }

    // 배지 목록 가져오기
    getBadges() {
        const data = localStorage.getItem(this.KEYS.BADGES);
        return data ? JSON.parse(data) : [];
    }

    // 업적 통계 가져오기
    getAchievements() {
        const data = localStorage.getItem(this.KEYS.ACHIEVEMENTS);
        return data ? JSON.parse(data) : {
            streak: 0,
            maxStreak: 0,
            goalAchieved: 0,
            perfectWeeks: 0,
            vegetableDays: 0,
            proteinDays: 0
        };
    }

    // 업적 통계 업데이트
    updateAchievements(updates) {
        const current = this.getAchievements();
        const updated = { ...current, ...updates };
        localStorage.setItem(this.KEYS.ACHIEVEMENTS, JSON.stringify(updated));
        return updated;
    }

    // 현재 연속 기록일 계산
    getCurrentStreak() {
        const meals = this.getMeals();
        if (meals.length === 0) return 0;

        // 날짜별로 그룹화
        const dateSet = new Set(meals.map(m => m.date));
        const sortedDates = Array.from(dateSet).sort().reverse();

        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        let checkDate = new Date(today);

        for (let i = 0; i < sortedDates.length; i++) {
            const dateStr = checkDate.toISOString().split('T')[0];

            if (sortedDates.includes(dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                // 오늘 기록이 없으면 streak는 0
                if (i === 0 && dateStr === today) {
                    // 어제부터 다시 체크
                    checkDate.setDate(checkDate.getDate() - 1);
                    continue;
                }
                break;
            }
        }

        return streak;
    }

    // 식사 저장 시 업적 업데이트
    saveMealWithAchievements(meal) {
        const mealData = this.saveMeal(meal);

        // 연속 기록일 업데이트
        const streak = this.getCurrentStreak();
        const achievements = this.getAchievements();
        const updates = {
            streak: streak,
            maxStreak: Math.max(achievements.maxStreak, streak)
        };

        // 목표 칼로리 달성 체크
        const todayCalories = this.getTodayCalories();
        const targetCalories = this.getSettings().targetCalories || 2000;
        const deviation = Math.abs(todayCalories - targetCalories) / targetCalories;

        if (deviation <= 0.1) { // 10% 이내
            updates.goalAchieved = (achievements.goalAchieved || 0) + 1;
        }

        // 채소 연속 섭취일 체크 (간단히 음식명에 채소 관련 키워드)
        const hasVeggie = /샐러드|채소|야채|상추|양상추|브로콜리|시금치/.test(meal.name);
        if (hasVeggie) {
            updates.vegetableDays = (achievements.vegetableDays || 0) + 1;
        }

        // 단백질 충분 섭취일 체크
        if (meal.protein >= 20) {
            updates.proteinDays = (achievements.proteinDays || 0) + 1;
        }

        // 주간 영양 점수 체크
        const weeklyScore = this.calculateWeeklyNutritionScore();
        if (weeklyScore.score >= 90) {
            updates.perfectWeeks = (achievements.perfectWeeks || 0) + 1;
        }

        this.updateAchievements(updates);

        // 배지 체크
        const newBadges = this.checkAndAwardBadges();

        return { mealData, newBadges };
    }

    // 간헐적 단식 초기화
    initFasting() {
        if (!localStorage.getItem(this.KEYS.FASTING)) {
            const initialFasting = {
                enabled: false,
                mode: '16:8',  // 16시간 단식, 8시간 식사
                fastingStartTime: null,
                fastingEndTime: null,
                eatingStartTime: null,
                eatingEndTime: null,
                isActive: false
            };
            localStorage.setItem(this.KEYS.FASTING, JSON.stringify(initialFasting));
        }
    }

    // 간헐적 단식 설정 가져오기
    getFastingSettings() {
        const data = localStorage.getItem(this.KEYS.FASTING);
        return data ? JSON.parse(data) : this.initFasting();
    }

    // 간헐적 단식 설정 저장
    saveFastingSettings(settings) {
        const current = this.getFastingSettings();
        const updated = { ...current, ...settings };
        localStorage.setItem(this.KEYS.FASTING, JSON.stringify(updated));
        return updated;
    }

    // 단식 시작
    startFasting() {
        const now = new Date().toISOString();
        const mode = this.getFastingSettings().mode || '16:8';
        const [fastHours, eatHours] = mode.split(':').map(Number);

        const fastingEndTime = new Date(now);
        fastingEndTime.setHours(fastingEndTime.getHours() + fastHours);

        return this.saveFastingSettings({
            isActive: true,
            fastingStartTime: now,
            fastingEndTime: fastingEndTime.toISOString(),
            eatingStartTime: null,
            eatingEndTime: null
        });
    }

    // 식사 시간 시작
    startEating() {
        const now = new Date().toISOString();
        const mode = this.getFastingSettings().mode || '16:8';
        const [fastHours, eatHours] = mode.split(':').map(Number);

        const eatingEndTime = new Date(now);
        eatingEndTime.setHours(eatingEndTime.getHours() + eatHours);

        return this.saveFastingSettings({
            isActive: false,
            eatingStartTime: now,
            eatingEndTime: eatingEndTime.toISOString()
        });
    }

    // 단식 상태 확인
    getFastingStatus() {
        const settings = this.getFastingSettings();

        if (!settings.enabled) {
            return {
                enabled: false,
                status: 'disabled'
            };
        }

        const now = new Date();

        // 단식 중
        if (settings.isActive && settings.fastingStartTime) {
            const startTime = new Date(settings.fastingStartTime);
            const endTime = new Date(settings.fastingEndTime);
            const elapsed = now - startTime;
            const total = endTime - startTime;
            const remaining = endTime - now;

            return {
                enabled: true,
                status: 'fasting',
                mode: settings.mode,
                startTime: settings.fastingStartTime,
                endTime: settings.fastingEndTime,
                elapsedHours: Math.floor(elapsed / (1000 * 60 * 60)),
                elapsedMinutes: Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60)),
                remainingHours: Math.max(0, Math.floor(remaining / (1000 * 60 * 60))),
                remainingMinutes: Math.max(0, Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))),
                progress: Math.min(100, Math.round((elapsed / total) * 100)),
                isCompleted: remaining <= 0
            };
        }

        // 식사 시간
        if (settings.eatingStartTime) {
            const startTime = new Date(settings.eatingStartTime);
            const endTime = new Date(settings.eatingEndTime);
            const elapsed = now - startTime;
            const total = endTime - startTime;
            const remaining = endTime - now;

            return {
                enabled: true,
                status: 'eating',
                mode: settings.mode,
                startTime: settings.eatingStartTime,
                endTime: settings.eatingEndTime,
                elapsedHours: Math.floor(elapsed / (1000 * 60 * 60)),
                elapsedMinutes: Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60)),
                remainingHours: Math.max(0, Math.floor(remaining / (1000 * 60 * 60))),
                remainingMinutes: Math.max(0, Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))),
                progress: Math.min(100, Math.round((elapsed / total) * 100)),
                shouldStartFasting: remaining <= 0
            };
        }

        return {
            enabled: true,
            status: 'idle'
        };
    }

    // 단식 종료
    endFasting() {
        return this.saveFastingSettings({
            isActive: false,
            fastingStartTime: null,
            fastingEndTime: null,
            eatingStartTime: null,
            eatingEndTime: null
        });
    }
}

// 싱글톤 인스턴스 export
export const storage = new StorageManager();
