// gemini.js - Google Gemini API 통합 모듈

export class GeminiAPI {
    constructor() {
        this.apiKey = null;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
    }

    // API 키 설정
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    // API 키 유효성 검사
    async validateApiKey(apiKey) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            const response = await fetch(url);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // 이미지를 Base64로 변환
    async imageToBase64(imageFile) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
        });
    }

    // 음식 이미지 분석
    async analyzeFoodImage(imageData) {
        if (!this.apiKey) {
            throw new Error('API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 입력해주세요.');
        }

        try {
            let base64Image;
            let mimeType = 'image/jpeg';

            // imageData가 File 객체인 경우
            if (imageData instanceof File || imageData instanceof Blob) {
                base64Image = await this.imageToBase64(imageData);
                mimeType = imageData.type || 'image/jpeg';
            }
            // imageData가 이미 base64 문자열인 경우
            else if (typeof imageData === 'string') {
                if (imageData.startsWith('data:')) {
                    const parts = imageData.split(',');
                    base64Image = parts[1];
                    const mimeMatch = parts[0].match(/:(.*?);/);
                    if (mimeMatch) mimeType = mimeMatch[1];
                } else {
                    base64Image = imageData;
                }
            }

            const prompt = `이 음식 이미지를 분석하여 다음 정보를 JSON 형식으로 제공해주세요:

1. 음식 이름 (한글명)
2. 예상 칼로리 (kcal)
3. 탄수화물 (g)
4. 단백질 (g)
5. 지방 (g)
6. 나트륨 (mg)

다음 JSON 형식으로 응답해주세요:
{
  "name": "음식 이름",
  "calories": 숫자,
  "carbs": 숫자,
  "protein": 숫자,
  "fat": 숫자,
  "sodium": 숫자
}

여러 음식이 있다면 주요 음식을 기준으로 합산해주세요.
1인분 기준으로 계산해주세요.
구체적인 숫자로 제공해주세요.`;

            const requestBody = {
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Image
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.4,
                    topK: 32,
                    topP: 1,
                    maxOutputTokens: 1024,
                }
            };

            const url = `${this.baseUrl}?key=${this.apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);

                if (response.status === 403) {
                    throw new Error('API 키가 유효하지 않습니다. 설정에서 API 키를 확인해주세요.');
                } else if (response.status === 429) {
                    throw new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
                } else {
                    throw new Error(`API 오류: ${errorData.error?.message || response.statusText}`);
                }
            }

            const data = await response.json();

            // 응답 파싱
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                throw new Error('AI 응답을 받을 수 없습니다.');
            }

            return this.parseGeminiResponse(text);

        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    }

    // Gemini 응답 파싱
    parseGeminiResponse(text) {
        try {
            // JSON 추출
            const jsonMatch = text.match(/\{[\s\S]*?\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);

                // 데이터 검증
                return {
                    name: parsed.name || '알 수 없는 음식',
                    calories: parseInt(parsed.calories) || 0,
                    carbs: parseFloat(parsed.carbs) || 0,
                    protein: parseFloat(parsed.protein) || 0,
                    fat: parseFloat(parsed.fat) || 0,
                    sodium: parseFloat(parsed.sodium) || 0
                };
            }

            // JSON이 없으면 텍스트 파싱
            return this.parseTextResponse(text);

        } catch (error) {
            console.error('Parse error:', error);
            throw new Error('AI 응답을 파싱할 수 없습니다.');
        }
    }

    // 텍스트 응답 파싱
    parseTextResponse(text) {
        const nutrition = {
            name: '',
            calories: 0,
            carbs: 0,
            protein: 0,
            fat: 0,
            sodium: 0
        };

        const lines = text.split('\n');

        for (const line of lines) {
            const lower = line.toLowerCase();

            // 음식명
            if (!nutrition.name && (lower.includes('음식') || lower.includes('이름') || lower.includes('name'))) {
                const nameMatch = line.match(/[:：]\s*(.+)/);
                if (nameMatch) {
                    nutrition.name = nameMatch[1].replace(/[*"']/g, '').trim();
                }
            }

            // 칼로리
            const calorieMatch = line.match(/(\d+)\s*(kcal|칼로리)/i);
            if (calorieMatch) {
                nutrition.calories = parseInt(calorieMatch[1]);
            }

            // 탄수화물
            if (lower.includes('탄수화물') || lower.includes('carb')) {
                const numMatch = line.match(/(\d+\.?\d*)\s*g/);
                if (numMatch) nutrition.carbs = parseFloat(numMatch[1]);
            }

            // 단백질
            if (lower.includes('단백질') || lower.includes('protein')) {
                const numMatch = line.match(/(\d+\.?\d*)\s*g/);
                if (numMatch) nutrition.protein = parseFloat(numMatch[1]);
            }

            // 지방
            if (lower.includes('지방') || lower.includes('fat')) {
                const numMatch = line.match(/(\d+\.?\d*)\s*g/);
                if (numMatch) nutrition.fat = parseFloat(numMatch[1]);
            }

            // 나트륨
            if (lower.includes('나트륨') || lower.includes('sodium')) {
                const numMatch = line.match(/(\d+\.?\d*)\s*mg/);
                if (numMatch) nutrition.sodium = parseFloat(numMatch[1]);
            }
        }

        if (!nutrition.name) {
            // 첫 번째 줄을 음식명으로 사용
            nutrition.name = lines[0].replace(/[*#\-:"']/g, '').trim() || '음식';
        }

        return nutrition;
    }

    // 간단한 텍스트 분석 (이미지 없이)
    async analyzeText(text) {
        if (!this.apiKey) {
            throw new Error('API 키가 설정되지 않았습니다.');
        }

        const requestBody = {
            contents: [{
                parts: [{ text }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            }
        };

        const url = `${this.baseUrl}?key=${this.apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API 오류: ${response.statusText}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    // API 사용 가능 여부 확인
    isReady() {
        return !!this.apiKey;
    }

    // 에러 메시지 한글화
    translateError(error) {
        const message = error.message || error.toString();

        if (message.includes('API key')) {
            return 'API 키를 확인해주세요. 설정에서 유효한 Gemini API 키를 입력해야 합니다.';
        }
        if (message.includes('quota') || message.includes('429')) {
            return 'API 사용 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
        }
        if (message.includes('network') || message.includes('fetch')) {
            return '네트워크 연결을 확인해주세요.';
        }
        if (message.includes('parse')) {
            return 'AI 응답을 해석할 수 없습니다. 다시 시도해주세요.';
        }

        return message;
    }
}

// 싱글톤 인스턴스 export
export const geminiAPI = new GeminiAPI();
