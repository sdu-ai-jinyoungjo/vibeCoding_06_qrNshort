# QRnShort (스마트 툴박스)

URL을 QR코드로 바꾸고, 긴 URL을 짧은 주소로 줄여 주는 URL 유틸리티 웹앱. 바이브코딩 6주차 2교시 프로젝트06.

- 사이트: https://sdu-ai-jinyoungjo.github.io/vibeCoding_06_qrNshort/

## 구성

| 경로 | 내용 |
|---|---|
| `index.html`, `style.css` | 메인 화면(스마트 툴박스): [QR코드], [URL단축] 버튼 |
| `url2qr/` | 5주차 2교시에 만든 URL2QR (프로젝트04를 그대로 복사) |
| `urlShort/` | 새로 만든 URL 단축기 |
| `functional_spec.md` | 기능명세서 |

## 사용 기술

- HTML, CSS, JavaScript만 사용 (빌드 도구 없음, GitHub Pages로 배포)
- QR코드: qrcode-generator 라이브러리 (cdnjs)
- URL 단축: da.gd OpenAPI, 실패하면 spoo.me OpenAPI. 둘 다 API 키가 필요 없고 브라우저에서 바로 부를 수 있다 (CORS 허용)

## 참고

- 처음 시도한 단축 서비스 중 일부는 다른 사이트에서의 호출을 막아서(CORS) 브라우저에서 쓸 수 없었다. 그래서 브라우저 호출을 허용하는 서비스만 골랐다.
- API 키가 필요한 단축 서비스는 쓰지 않았다. GitHub에 올리면 키가 그대로 공개되기 때문이다.
- 단축할 URL은 da.gd(실패하면 spoo.me) 서버로 보내진다.
