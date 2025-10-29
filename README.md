# 🍽️ FoodAI - AI 기반 구내식당 칼로리 관리 서비스

> 2025년 새싹 해커톤(SeSAC Hackathon) 출품작

구내식당에서 찍은 음식 사진만으로 AI가 자동으로 칼로리와 영양 성분을 분석하고, 운동량까지 환산해주는 스마트 칼로리 관리 서비스입니다.

## 🌟 주요 기능

### 📸 간편한 음식 분석
- 음식 사진만 찍으면 자동으로 칼로리 분석
- 갤러리에서 사진 선택도 가능
- 실시간 AI 분석으로 빠른 결과 제공

### ✨ AI 이미지 보정
- **나노바나나** 모델로 어두운 사진도 선명하게
- 구내식당의 조명이 어두워도 정확한 분석 가능
- 원본/보정본 비교 기능

### 🤖 정확한 영양 분석
- **Google Gemini Vision API** 활용
- 음식 자동 인식 (한국 음식 포함)
- 칼로리, 탄수화물, 단백질, 지방, 나트륨 등 상세 정보

### 🏃 운동량 환산
- 섭취한 칼로리를 운동 시간으로 변환
- 걷기, 조깅, 수영, 자전거 등 다양한 운동 제공
- "치킨 1조각 = 조깅 30분" 같은 직관적 정보

### 📊 칼로리 트래킹
- 일별/주별/월별 통계
- 목표 칼로리 설정 및 진행률 표시
- 로컬스토리지 기반 안전한 데이터 저장

### ✏️ 수동 조정
- AI 분석 결과 수정 가능
- 음식명, 칼로리 직접 입력
- 개인화된 데이터 관리

## 🚀 사용 방법

### 1. 웹사이트 접속
```
https://hwkim3330.github.io/foodai/
```

### 2. Gemini API 키 설정
1. [Google AI Studio](https://aistudio.google.com/app/apikey)에서 무료 API 키 발급
2. FoodAI 설정 페이지에서 API 키 입력
3. 로컬스토리지에 안전하게 저장됨

### 3. 음식 사진 촬영/업로드
- 카메라 버튼으로 직접 촬영
- 또는 갤러리에서 사진 선택

### 4. AI 분석 결과 확인
- 자동으로 음식 인식 및 영양 분석
- 운동량 환산 정보 확인
- 필요시 수동으로 수정

### 5. 칼로리 관리
- 통계 페이지에서 일일/주간/월간 추이 확인
- 목표 칼로리 대비 진행률 체크

## 🛠️ 기술 스택

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Canvas API (이미지 처리)
- LocalStorage API (데이터 저장)
- Responsive Web Design

### AI/ML
- **Google Gemini Vision API** - 음식 인식 및 영양 분석
- **나노바나나** - AI 이미지 보정
- Hugging Face Inference API

### 배포
- GitHub Pages (정적 웹 호스팅)
- HTTPS 지원

## 📁 프로젝트 구조

```
foodai/
├── index.html                 # 메인 페이지
├── css/
│   └── style.css             # 스타일시트
├── js/
│   ├── app.js                # 메인 앱 로직
│   ├── gemini.js             # Gemini API 연동
│   ├── nanobanana.js         # 이미지 보정
│   ├── nutrition.js          # 영양 분석 및 운동량 환산
│   └── storage.js            # 로컬스토리지 관리
├── images/                   # 이미지 리소스
├── README.md                 # 프로젝트 설명
└── hackathon_proposal.md     # 해커톤 기획서
```

## 🎯 활용 데이터

| 데이터명 | 출처 | 용도 |
|---------|------|------|
| 한국 음식 이미지 | AI Hub | 음식 인식/분류 학습 |
| 식품영양성분 DB | 식품의약품안전처 | 영양 정보 참조 |
| Gemini Vision API | Google AI | 이미지 분석 |
| 나노바나나 | Hugging Face | 이미지 보정 |

## 💡 핵심 차별점

✅ **2단계 AI 처리**
- 이미지 보정 → 분석으로 정확도 향상
- 어두운 구내식당 환경에 최적화

✅ **운동량 환산**
- 칼로리를 운동 시간으로 직관적 표현
- 건강 관리 동기 부여

✅ **완전 무료**
- 서버 불필요, 100% 클라이언트 사이드
- 사용자 개인 API 키 사용
- 설치 불필요, 웹에서 바로 사용

✅ **개인정보 보호**
- 모든 데이터 로컬스토리지 저장
- 서버 전송 없음
- 사용자가 완전히 제어

## 📊 기대효과

### 개인
- 일일 식단 관리 시간 90% 단축
- 정확한 칼로리 추적으로 목표 달성
- 건강한 식습관 형성

### 사회
- 비만 예방 및 건강 증진
- 국가 의료비 절감 기여
- 건강한 사회 구성원 증가

## 🔧 로컬 개발 환경 설정

### 1. 저장소 클론
```bash
git clone https://github.com/hwkim3330/foodai.git
cd foodai
```

### 2. 로컬 서버 실행
```bash
# Python 3 사용
python3 -m http.server 8000

# 또는 Node.js 사용
npx serve
```

### 3. 브라우저에서 열기
```
http://localhost:8000
```

## 🧪 테스트

### 테스트 시나리오
1. ✅ 음식 사진 업로드 및 인식
2. ✅ 이미지 보정 전/후 비교
3. ✅ 칼로리 및 영양 성분 분석
4. ✅ 운동량 환산 계산
5. ✅ 데이터 저장 및 불러오기
6. ✅ 통계 차트 표시
7. ✅ 수동 조정 기능
8. ✅ 모바일 반응형 디자인

## 🚀 배포

### GitHub Pages 배포
```bash
# main 브랜치에 푸시
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main

# GitHub 저장소 Settings > Pages에서 배포 활성화
```

## 📝 향후 계획

### 단기 (3개월)
- [ ] 음식 데이터베이스 확장
- [ ] PWA 지원 (오프라인 사용)
- [ ] 사용자 피드백 수집

### 중기 (6개월)
- [ ] 식당별 메뉴 데이터베이스
- [ ] 친구와 칼로리 챌린지
- [ ] AI 추천 식단 기능

### 장기 (1년)
- [ ] 기업 구내식당 공식 연동
- [ ] 건강검진 데이터 연계
- [ ] AI 영양 상담 챗봇

## 🤝 기여하기

이 프로젝트는 2025년 새싹 해커톤 출품작입니다.
버그 리포트나 기능 제안은 Issues에 등록해주세요!

## 📄 라이선스

MIT License

## 👥 팀 정보

**2025 새싹 해커톤 참가팀**
- GitHub: [@hwkim3330](https://github.com/hwkim3330)

## 📚 참고 자료

- [Google Gemini API 문서](https://ai.google.dev/)
- [Hugging Face](https://huggingface.co/)
- [식품안전나라 API](https://www.foodsafetykorea.go.kr/)
- [AI Hub](https://aihub.or.kr/)

## 📞 문의

프로젝트에 대한 문의사항은 GitHub Issues를 이용해주세요.

---

**Made with ❤️ for 2025 SeSAC Hackathon**