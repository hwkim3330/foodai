// nanobanana.js - 이미지 보정 모듈
// Canvas API를 사용한 이미지 품질 향상

export class ImageEnhancer {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }

    // 이미지 파일을 로드하여 Image 객체로 변환
    async loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('이미지를 로드할 수 없습니다.'));
            };

            img.src = url;
        });
    }

    // 이미지 보정 (밝기, 대비, 선명도 향상)
    async enhanceImage(file, options = {}) {
        try {
            const img = await this.loadImage(file);

            // 캔버스 크기 설정 (최대 크기 제한)
            const maxSize = options.maxSize || 2048;
            let width = img.width;
            let height = img.height;

            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            this.canvas.width = width;
            this.canvas.height = height;

            // 원본 이미지 그리기
            this.ctx.drawImage(img, 0, 0, width, height);

            // 이미지 데이터 가져오기
            const imageData = this.ctx.getImageData(0, 0, width, height);

            // 보정 적용
            const enhanced = this.applyEnhancements(imageData, {
                brightness: options.brightness || 1.15,
                contrast: options.contrast || 1.2,
                saturation: options.saturation || 1.1,
                sharpness: options.sharpness || 1.0
            });

            // 보정된 이미지 적용
            this.ctx.putImageData(enhanced, 0, 0);

            // 선명도 향상 (Unsharp Mask)
            if (options.sharpness && options.sharpness > 1.0) {
                this.applySharpen(options.sharpness);
            }

            // Canvas를 Blob으로 변환
            return await this.canvasToBlob();

        } catch (error) {
            console.error('Image enhancement error:', error);
            throw error;
        }
    }

    // 보정 필터 적용
    applyEnhancements(imageData, options) {
        const data = imageData.data;
        const { brightness, contrast, saturation } = options;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // 밝기 조정
            r *= brightness;
            g *= brightness;
            b *= brightness;

            // 대비 조정
            const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));
            r = factor * (r - 128) + 128;
            g = factor * (g - 128) + 128;
            b = factor * (b - 128) + 128;

            // 채도 조정
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = gray + saturation * (r - gray);
            g = gray + saturation * (g - gray);
            b = gray + saturation * (b - gray);

            // 값 제한 (0-255)
            data[i] = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
        }

        return imageData;
    }

    // 선명도 향상 (Unsharp Mask 간이 버전)
    applySharpen(amount) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const imageData = this.ctx.getImageData(0, 0, width, height);
        const original = new Uint8ClampedArray(imageData.data);

        // 간단한 선명화 커널
        const sharpenKernel = [
            0, -1, 0,
            -1, 5, -1,
            0, -1, 0
        ];

        const data = imageData.data;
        const factor = amount - 1.0;

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;

                for (let c = 0; c < 3; c++) {
                    let sum = 0;
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            const i = ((y + ky) * width + (x + kx)) * 4 + c;
                            const kernelIdx = (ky + 1) * 3 + (kx + 1);
                            sum += original[i] * sharpenKernel[kernelIdx];
                        }
                    }

                    // 원본과 블렌딩
                    const enhanced = original[idx + c] + (sum - original[idx + c]) * factor;
                    data[idx + c] = Math.max(0, Math.min(255, enhanced));
                }
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    // Canvas를 Blob으로 변환
    canvasToBlob(type = 'image/jpeg', quality = 0.92) {
        return new Promise((resolve, reject) => {
            this.canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Blob 생성 실패'));
                    }
                },
                type,
                quality
            );
        });
    }

    // Canvas를 Data URL로 변환
    canvasToDataURL(type = 'image/jpeg', quality = 0.92) {
        return this.canvas.toDataURL(type, quality);
    }

    // 간단한 자동 보정 (어두운 이미지 감지 및 보정)
    async autoEnhance(file) {
        const img = await this.loadImage(file);

        // 샘플링하여 평균 밝기 계산
        this.canvas.width = 100;
        this.canvas.height = 100;
        this.ctx.drawImage(img, 0, 0, 100, 100);

        const imageData = this.ctx.getImageData(0, 0, 100, 100);
        const data = imageData.data;
        let totalBrightness = 0;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;
            totalBrightness += brightness;
        }

        const avgBrightness = totalBrightness / (data.length / 4);

        // 평균 밝기에 따라 보정 강도 결정
        let brightnessAdjust = 1.0;
        let contrastAdjust = 1.0;

        if (avgBrightness < 80) {
            // 매우 어두움
            brightnessAdjust = 1.4;
            contrastAdjust = 1.3;
        } else if (avgBrightness < 120) {
            // 어두움
            brightnessAdjust = 1.2;
            contrastAdjust = 1.2;
        } else if (avgBrightness > 180) {
            // 너무 밝음
            brightnessAdjust = 0.95;
            contrastAdjust = 1.1;
        }

        // 보정 적용
        return await this.enhanceImage(file, {
            brightness: brightnessAdjust,
            contrast: contrastAdjust,
            saturation: 1.1,
            sharpness: 1.15
        });
    }

    // 이미지 리사이즈
    async resizeImage(file, maxWidth = 1024, maxHeight = 1024) {
        const img = await this.loadImage(file);

        let width = img.width;
        let height = img.height;

        // 비율 유지하면서 리사이즈
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }

        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.drawImage(img, 0, 0, width, height);

        return await this.canvasToBlob();
    }

    // Hugging Face API를 사용한 실제 나노바나나 모델 호출 (선택적)
    async enhanceWithHuggingFace(file, apiKey) {
        // 실제 프로덕션에서는 Hugging Face의 이미지 보정 모델을 사용
        // 예: facebook/detr-resnet-50 또는 다른 이미지 enhancement 모델

        if (!apiKey) {
            // API 키가 없으면 기본 Canvas 보정 사용
            return await this.autoEnhance(file);
        }

        try {
            const formData = new FormData();
            formData.append('file', file);

            // 예시 엔드포인트 (실제로는 적절한 모델 선택 필요)
            const response = await fetch(
                'https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: file
                }
            );

            if (!response.ok) {
                throw new Error('Hugging Face API 오류');
            }

            const blob = await response.blob();
            return blob;

        } catch (error) {
            console.warn('Hugging Face API 실패, 기본 보정 사용:', error);
            return await this.autoEnhance(file);
        }
    }

    // 메모리 정리
    cleanup() {
        this.canvas.width = 0;
        this.canvas.height = 0;
    }
}

// 싱글톤 인스턴스 export
export const imageEnhancer = new ImageEnhancer();
