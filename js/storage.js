// storage.js - 로컬스토리지 관리 모듈

export class StorageManager {
    constructor() {
        this.KEYS = {
            API_KEY: 'foodai_api_key',
            MEALS: 'foodai_meals',
            SETTINGS: 'foodai_settings',
            USER_INFO: 'foodai_user_info'
        };
        this.initDefaults();
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
}

// 싱글톤 인스턴스 export
export const storage = new StorageManager();
