# TBR 웹페이지

이 폴더는 `2026_tbr.md`에서 생성한 `data/books.json`을 기반으로 동작하는 정적 웹페이지입니다.

## 컨텍스트 요약
- 현재 상태 요약: `PROJECT_CONTEXT.md`

## 구조
- `index.html` : 메인 페이지
- `styles.css` : 스타일
- `app.js` : 로직
- `data/books.json` : 책 목록 데이터
- `scripts/convert_tbr_to_json.py` : 마크다운 → JSON 변환 스크립트

## GitHub Pages 배포
1. GitHub에 새 저장소 생성
2. 이 폴더 내용을 저장소에 업로드
3. GitHub Pages 활성화 (`main` 브랜치 / `/root`)

## GitHub에 저장(동기화)
1. GitHub Personal Access Token 생성 (권한: `repo` 또는 public repo만이면 `public_repo`)
2. 페이지의 `GitHub 저장 설정`에서 다음을 입력
   - 사용자명, 저장소명
   - 파일 경로: `data/books.json`
   - 토큰
3. `GitHub에 저장` 클릭

## 로컬 데이터
브라우저에서 수정한 내용은 `localStorage`에 임시 저장됩니다.
`GitHub에 저장`을 누르면 저장소 파일이 업데이트되고, 로컬 임시 데이터는 초기화됩니다.

## 데이터 재생성
`2026_tbr.md`를 다시 읽어 초기화하려면:

```powershell
python D:\Download\tbr-web\scripts\convert_tbr_to_json.py
```

