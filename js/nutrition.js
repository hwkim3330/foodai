// nutrition.js - 영양 분석 및 운동량 환산 모듈

export class NutritionAnalyzer {
    constructor() {
        // MET (Metabolic Equivalent of Task) 값
        this.exercises = [
            { name: '빠르게 걷기', icon: '🚶', met: 3.5, unit: '분' },
            { name: '조깅', icon: '🏃', met: 7.0, unit: '분' },
            { name: '달리기 (10km/h)', icon: '🏃‍♂️', met: 10.0, unit: '분' },
            { name: '자전거 (보통 속도)', icon: '🚴', met: 6.8, unit: '분' },
            { name: '수영 (자유형)', icon: '🏊', met: 8.0, unit: '분' },
            { name: '등산', icon: '⛰️', met: 6.5, unit: '분' },
            { name: '요가', icon: '🧘', met: 2.5, unit: '분' },
            { name: '근력 운동', icon: '🏋️', met: 5.0, unit: '분' },
            { name: '농구', icon: '🏀', met: 6.5, unit: '분' },
            { name: '축구', icon: '⚽', met: 7.0, unit: '분' }
        ];
    }

    // 칼로리를 운동 시간으로 환산
    calculateExerciseDuration(calories, weight = 70) {
        return this.exercises.map(exercise => {
            // MET 공식: 칼로리/시간 = MET × 체중(kg) × 1.05
            const caloriesPerHour = exercise.met * weight * 1.05;
            const hours = calories / caloriesPerHour;
            const minutes = Math.round(hours * 60);

            return {
                name: exercise.name,
                icon: exercise.icon,
                duration: minutes,
                unit: exercise.unit
            };
        });
    }

    // 영양 정보 검증
    validateNutrition(nutrition) {
        const validated = {
            name: nutrition.name || '알 수 없는 음식',
            calories: Math.max(0, parseInt(nutrition.calories) || 0),
            carbs: Math.max(0, parseFloat(nutrition.carbs) || 0),
            protein: Math.max(0, parseFloat(nutrition.protein) || 0),
            fat: Math.max(0, parseFloat(nutrition.fat) || 0),
            sodium: Math.max(0, parseFloat(nutrition.sodium) || 0)
        };

        // 영양소로부터 칼로리 재계산 (검증용)
        const calculatedCalories =
            (validated.carbs * 4) +
            (validated.protein * 4) +
            (validated.fat * 9);

        // 차이가 크면 경고
        if (validated.calories > 0 && Math.abs(validated.calories - calculatedCalories) > validated.calories * 0.3) {
            console.warn('영양소 합계와 총 칼로리가 일치하지 않습니다.');
        }

        return validated;
    }

    // 영양소 비율 계산
    calculateMacroRatios(nutrition) {
        const { carbs, protein, fat } = nutrition;
        const totalCalories = (carbs * 4) + (protein * 4) + (fat * 9);

        if (totalCalories === 0) {
            return { carbs: 0, protein: 0, fat: 0 };
        }

        return {
            carbs: Math.round((carbs * 4 / totalCalories) * 100),
            protein: Math.round((protein * 4 / totalCalories) * 100),
            fat: Math.round((fat * 9 / totalCalories) * 100)
        };
    }

    // 음식 평가
    evaluateNutrition(nutrition) {
        const { calories, carbs, protein, fat, sodium } = nutrition;
        const issues = [];
        const recommendations = [];

        // 칼로리 평가
        if (calories > 800) {
            issues.push('고칼로리 식단입니다');
            recommendations.push('저칼로리 음식과 함께 드세요');
        }

        // 나트륨 평가
        if (sodium > 800) {
            issues.push('나트륨 함량이 높습니다');
            recommendations.push('물을 충분히 마시세요');
        }

        // 단백질 평가
        if (protein < 10 && calories > 300) {
            issues.push('단백질이 부족합니다');
            recommendations.push('단백질 보충을 권장합니다');
        }

        // 지방 평가
        const fatCalories = fat * 9;
        if (fatCalories / calories > 0.35) {
            issues.push('지방 비율이 높습니다');
            recommendations.push('균형잡힌 식단을 권장합니다');
        }

        return {
            issues,
            recommendations,
            score: this.calculateNutritionScore(nutrition)
        };
    }

    // 영양 점수 계산 (0-100)
    calculateNutritionScore(nutrition) {
        let score = 100;

        const { calories, carbs, protein, fat, sodium } = nutrition;
        const totalCalories = (carbs * 4) + (protein * 4) + (fat * 9);

        if (totalCalories === 0) return 0;

        // 영양소 비율 평가
        const proteinRatio = (protein * 4) / totalCalories;
        const fatRatio = (fat * 9) / totalCalories;

        // 단백질이 너무 적으면 감점
        if (proteinRatio < 0.15) score -= 15;

        // 지방이 너무 많으면 감점
        if (fatRatio > 0.35) score -= 20;

        // 칼로리가 너무 높으면 감점
        if (calories > 800) score -= 15;

        // 나트륨이 너무 높으면 감점
        if (sodium > 1000) score -= 20;

        return Math.max(0, Math.min(100, score));
    }

    // 권장 섭취량 대비 비율
    getDailyValuePercentage(nutrition) {
        // 1일 권장 섭취량 (2000 kcal 기준)
        const dv = {
            calories: 2000,
            carbs: 300,      // g
            protein: 50,     // g
            fat: 65,         // g
            sodium: 2300     // mg
        };

        return {
            calories: Math.round((nutrition.calories / dv.calories) * 100),
            carbs: Math.round((nutrition.carbs / dv.carbs) * 100),
            protein: Math.round((nutrition.protein / dv.protein) * 100),
            fat: Math.round((nutrition.fat / dv.fat) * 100),
            sodium: Math.round((nutrition.sodium / dv.sodium) * 100)
        };
    }

    // 간단한 음식명 추출 (한글만)
    extractFoodName(text) {
        // 괄호, 특수문자 제거하고 첫 번째 음식명만 추출
        const cleaned = text
            .replace(/[()[\]<>{}]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        // 첫 번째 쉼표나 플러스 기호 전까지
        const firstFood = cleaned.split(/[,+]/)[0].trim();

        return firstFood || '음식';
    }

    // 텍스트에서 영양 정보 파싱 (Gemini 응답 파싱)
    parseNutritionFromText(text) {
        const nutrition = {
            name: '',
            calories: 0,
            carbs: 0,
            protein: 0,
            fat: 0,
            sodium: 0
        };

        try {
            // JSON 형식으로 응답이 온 경우
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                return this.validateNutrition(data);
            }

            // 텍스트 파싱
            const lines = text.split('\n');

            for (const line of lines) {
                const lower = line.toLowerCase();

                // 음식명
                if (lower.includes('음식') || lower.includes('food') || lower.includes('dish')) {
                    const nameMatch = line.match(/[:：]\s*(.+)/);
                    if (nameMatch) {
                        nutrition.name = nameMatch[1].trim();
                    }
                }

                // 칼로리
                const calorieMatch = line.match(/(\d+)\s*(kcal|칼로리)/i);
                if (calorieMatch) {
                    nutrition.calories = parseInt(calorieMatch[1]);
                }

                // 탄수화물
                const carbsMatch = line.match(/탄수화물|carb/i);
                if (carbsMatch) {
                    const numMatch = line.match(/(\d+\.?\d*)\s*g/);
                    if (numMatch) nutrition.carbs = parseFloat(numMatch[1]);
                }

                // 단백질
                const proteinMatch = line.match(/단백질|protein/i);
                if (proteinMatch) {
                    const numMatch = line.match(/(\d+\.?\d*)\s*g/);
                    if (numMatch) nutrition.protein = parseFloat(numMatch[1]);
                }

                // 지방
                const fatMatch = line.match(/지방|fat/i);
                if (fatMatch) {
                    const numMatch = line.match(/(\d+\.?\d*)\s*g/);
                    if (numMatch) nutrition.fat = parseFloat(numMatch[1]);
                }

                // 나트륨
                const sodiumMatch = line.match(/나트륨|sodium/i);
                if (sodiumMatch) {
                    const numMatch = line.match(/(\d+\.?\d*)\s*mg/);
                    if (numMatch) nutrition.sodium = parseFloat(numMatch[1]);
                }
            }
        } catch (error) {
            console.error('Parsing error:', error);
        }

        return this.validateNutrition(nutrition);
    }

    // 식사 시간 분류
    getMealType() {
        const hour = new Date().getHours();

        if (hour >= 6 && hour < 10) return '아침';
        if (hour >= 10 && hour < 12) return '아침간식';
        if (hour >= 12 && hour < 15) return '점심';
        if (hour >= 15 && hour < 18) return '오후간식';
        if (hour >= 18 && hour < 21) return '저녁';
        return '야식';
    }

    // 오늘 부족한 영양소 분석
    analyzeMissingNutrients(todayMeals, targetCalories = 2000) {
        // 오늘 먹은 영양소 합계
        const total = {
            calories: 0,
            carbs: 0,
            protein: 0,
            fat: 0,
            sodium: 0
        };

        todayMeals.forEach(meal => {
            total.calories += meal.calories || 0;
            total.carbs += meal.carbs || 0;
            total.protein += meal.protein || 0;
            total.fat += meal.fat || 0;
            total.sodium += meal.sodium || 0;
        });

        // 권장 섭취량 (targetCalories 기준으로 비율 조정)
        const ratio = targetCalories / 2000;
        const recommended = {
            calories: targetCalories,
            carbs: 300 * ratio,      // g
            protein: 50 * ratio,     // g
            fat: 65 * ratio,         // g
            sodium: 2300            // mg (고정)
        };

        // 부족/과다 계산
        const missing = {
            calories: Math.max(0, recommended.calories - total.calories),
            carbs: Math.max(0, recommended.carbs - total.carbs),
            protein: Math.max(0, recommended.protein - total.protein),
            fat: Math.max(0, recommended.fat - total.fat),
            sodium: total.sodium - recommended.sodium  // 나트륨은 과다 체크
        };

        const deficiencies = [];
        const excesses = [];

        // 심각한 부족 (권장량의 50% 미만)
        if (total.protein < recommended.protein * 0.5) {
            deficiencies.push({
                nutrient: '단백질',
                current: Math.round(total.protein),
                recommended: Math.round(recommended.protein),
                missing: Math.round(missing.protein),
                severity: 'high',
                suggestion: '닭가슴살, 계란, 두부, 생선'
            });
        } else if (total.protein < recommended.protein * 0.8) {
            deficiencies.push({
                nutrient: '단백질',
                current: Math.round(total.protein),
                recommended: Math.round(recommended.protein),
                missing: Math.round(missing.protein),
                severity: 'medium',
                suggestion: '계란, 우유, 요거트'
            });
        }

        if (total.carbs < recommended.carbs * 0.5) {
            deficiencies.push({
                nutrient: '탄수화물',
                current: Math.round(total.carbs),
                recommended: Math.round(recommended.carbs),
                missing: Math.round(missing.carbs),
                severity: 'high',
                suggestion: '현미밥, 고구마, 통밀빵, 오트밀'
            });
        }

        // 과다 섭취
        if (total.sodium > recommended.sodium * 1.2) {
            excesses.push({
                nutrient: '나트륨',
                current: Math.round(total.sodium),
                recommended: Math.round(recommended.sodium),
                excess: Math.round(total.sodium - recommended.sodium),
                severity: total.sodium > recommended.sodium * 1.5 ? 'high' : 'medium',
                suggestion: '물을 충분히 마시고, 다음 식사는 저염식으로'
            });
        }

        if (total.calories > recommended.calories * 1.2) {
            excesses.push({
                nutrient: '칼로리',
                current: Math.round(total.calories),
                recommended: Math.round(recommended.calories),
                excess: Math.round(total.calories - recommended.calories),
                severity: 'medium',
                suggestion: '가벼운 운동이나 내일 칼로리 조절 권장'
            });
        }

        return {
            total,
            recommended,
            missing,
            deficiencies,
            excesses,
            score: this.calculateNutrientBalanceScore(total, recommended)
        };
    }

    // 영양소 균형 점수 (0-100)
    calculateNutrientBalanceScore(total, recommended) {
        let score = 100;

        // 단백질 부족 감점
        const proteinRatio = total.protein / recommended.protein;
        if (proteinRatio < 0.5) score -= 30;
        else if (proteinRatio < 0.8) score -= 15;

        // 나트륨 과다 감점
        const sodiumRatio = total.sodium / recommended.sodium;
        if (sodiumRatio > 1.5) score -= 25;
        else if (sodiumRatio > 1.2) score -= 10;

        // 칼로리 편차 감점
        const calorieDeviation = Math.abs(total.calories - recommended.calories) / recommended.calories;
        if (calorieDeviation > 0.3) score -= 20;
        else if (calorieDeviation > 0.15) score -= 10;

        // 지방 과다 감점
        const fatCal = total.fat * 9;
        const totalCal = total.calories || 1;
        const fatRatio = fatCal / totalCal;
        if (fatRatio > 0.4) score -= 15;

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    // 시간대별 최적 음식 추천
    getTimeBasedFoodSuggestions() {
        const hour = new Date().getHours();

        if (hour >= 6 && hour < 10) {
            // 아침
            return {
                mealType: '아침',
                suggestions: [
                    { food: '오트밀 + 과일', calories: 300, reason: '에너지 충전과 섬유질' },
                    { food: '계란 2개 + 통밀빵', calories: 350, reason: '단백질과 복합 탄수화물' },
                    { food: '그릭 요거트 + 견과류', calories: 280, reason: '단백질과 건강한 지방' }
                ],
                tip: '아침은 하루 에너지의 25-30%를 섭취하세요'
            };
        } else if (hour >= 10 && hour < 12) {
            // 오전 간식
            return {
                mealType: '오전 간식',
                suggestions: [
                    { food: '바나나', calories: 105, reason: '빠른 에너지 보충' },
                    { food: '아몬드 한 줌', calories: 160, reason: '포만감과 집중력' },
                    { food: '사과', calories: 95, reason: '섬유질과 비타민' }
                ],
                tip: '가볍게 100-150 kcal 정도가 적당해요'
            };
        } else if (hour >= 12 && hour < 15) {
            // 점심
            return {
                mealType: '점심',
                suggestions: [
                    { food: '연어 샐러드', calories: 450, reason: '단백질과 오메가3' },
                    { food: '닭가슴살 덮밥', calories: 550, reason: '균형 잡힌 영양소' },
                    { food: '퀴노아 볼', calories: 480, reason: '완전 단백질과 채소' }
                ],
                tip: '점심은 하루 에너지의 35-40%를 섭취하세요'
            };
        } else if (hour >= 15 && hour < 18) {
            // 오후 간식
            return {
                mealType: '오후 간식',
                suggestions: [
                    { food: '단백질 쉐이크', calories: 150, reason: '근육 회복과 포만감' },
                    { food: '당근 + 후무스', calories: 120, reason: '저칼로리 고영양' },
                    { food: '삶은 계란', calories: 70, reason: '단백질 보충' }
                ],
                tip: '저녁까지 버틸 수 있는 가벼운 간식을 선택하세요'
            };
        } else if (hour >= 18 && hour < 21) {
            // 저녁
            return {
                mealType: '저녁',
                suggestions: [
                    { food: '두부 김치찌개', calories: 350, reason: '저칼로리 고단백' },
                    { food: '닭가슴살 구이 + 채소', calories: 400, reason: '가볍고 소화 잘됨' },
                    { food: '새우 샐러드', calories: 320, reason: '저칼로리 고단백' }
                ],
                tip: '저녁은 가볍게, 취침 3시간 전까지 식사하세요'
            };
        } else {
            // 야식
            return {
                mealType: '야식',
                suggestions: [
                    { food: '따뜻한 우유', calories: 100, reason: '숙면 도움' },
                    { food: '방울토마토', calories: 30, reason: '저칼로리 간식' },
                    { food: '플레인 요거트', calories: 80, reason: '소화 잘됨' }
                ],
                tip: '야식은 피하는 것이 좋지만, 꼭 필요하다면 200 kcal 이하로'
            };
        }
    }

    // 음식 이모지 추천
    getFoodEmoji(foodName) {
        const lower = foodName.toLowerCase();

        if (lower.includes('밥') || lower.includes('rice')) return '🍚';
        if (lower.includes('면') || lower.includes('국수') || lower.includes('noodle')) return '🍜';
        if (lower.includes('빵') || lower.includes('bread')) return '🍞';
        if (lower.includes('치킨') || lower.includes('chicken')) return '🍗';
        if (lower.includes('피자') || lower.includes('pizza')) return '🍕';
        if (lower.includes('햄버거') || lower.includes('burger')) return '🍔';
        if (lower.includes('샐러드') || lower.includes('salad')) return '🥗';
        if (lower.includes('과일') || lower.includes('fruit')) return '🍎';
        if (lower.includes('우유') || lower.includes('milk')) return '🥛';
        if (lower.includes('커피') || lower.includes('coffee')) return '☕';
        if (lower.includes('김치') || lower.includes('kimchi')) return '🥬';
        if (lower.includes('고기') || lower.includes('meat')) return '🥩';
        if (lower.includes('생선') || lower.includes('fish')) return '🐟';
        if (lower.includes('계란') || lower.includes('egg')) return '🥚';

        return '🍽️';
    }
}

// 싱글톤 인스턴스 export
export const nutritionAnalyzer = new NutritionAnalyzer();
