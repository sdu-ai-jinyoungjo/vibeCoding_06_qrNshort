const TIMEOUT_MS = 10000; // 단축 서비스가 10초 안에 응답하지 않으면 실패로 보고 다음 서비스로

const form = document.getElementById("shorten-form");
const input = document.getElementById("url-input");
const shortenButton = document.getElementById("shorten-button");
const result = document.getElementById("result");
const copyButton = document.getElementById("copy-button");
const message = document.getElementById("message");
const toast = document.getElementById("toast");

function showMessage(text) {
  message.textContent = text;
}

// '복사하였습니다' 같은 알림을 2초 동안 보여 줌
let toastTimer = 0;
function showToast(text) {
  toast.textContent = text;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2000);
}

// 입력값을 웹사이트 주소로 정리함 (url2qr와 같은 규칙). 앞에 http:// 나 https:// 가 없으면 https:// 를 붙임
function normalizeUrl(value) {
  const text = value.trim();
  const withProtocol = /^https?:\/\//i.test(text) ? text : `https://${text}`;

  try {
    const url = new URL(withProtocol);
    // 아이디·비밀번호(@)가 들어간 주소(예: 이메일 주소, mailto:)는 거름
    if (url.username || url.password) {
      return null;
    }
    // 도메인에는 영문·숫자·점(.)·하이픈(-)만 있어야 함 (한글 도메인은 xn--로 시작하는 형태로 바뀐 뒤 검사됨)
    if (!/^[a-z0-9.-]+$/.test(url.hostname)) {
      return null;
    }
    // 점(.)이 없는 주소(예: hello, localhost)는 다른 사람이 열 수 있는 웹사이트 주소가 아니므로 거름
    if (!url.hostname.includes(".")) {
      return null;
    }
    return url.href;
  } catch (error) {
    return null;
  }
}

// 정해진 시간 안에 응답이 없으면 요청을 끊음
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// URL 단축 OpenAPI 목록. API 키가 필요 없고 브라우저에서 바로 부를 수 있는(CORS 허용) 서비스만 씀
const SHORTENERS = [
  // da.gd: 단축된 주소를 글자로 돌려줌
  async function daGd(longUrl) {
    const response = await fetchWithTimeout(`https://da.gd/s?url=${encodeURIComponent(longUrl)}`);
    const text = (await response.text()).trim();
    if (!response.ok) {
      throw new Error(`da.gd: ${text}`);
    }
    return text;
  },
  // spoo.me: 단축된 주소를 JSON으로 돌려줌
  async function spooMe(longUrl) {
    const response = await fetchWithTimeout("https://spoo.me/", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new URLSearchParams({ url: longUrl }),
    });
    const data = await response.json();
    if (!response.ok || !data.short_url) {
      throw new Error(`spoo.me: ${JSON.stringify(data)}`);
    }
    return data.short_url.replace(/^http:\/\//, "https://");
  },
];

// 앞의 서비스가 실패하면 다음 서비스로 다시 시도함
async function shortenUrl(longUrl) {
  let onlyNetworkErrors = true;
  for (const shorten of SHORTENERS) {
    try {
      const shortUrl = await shorten(longUrl);
      if (/^https:\/\/\S+$/.test(shortUrl)) {
        return shortUrl;
      }
      onlyNetworkErrors = false; // 응답은 왔지만 주소 모양이 아님
    } catch (error) {
      console.error(error);
      // TypeError: 인터넷 연결이나 CORS 문제, AbortError: 시간 초과
      if (!(error instanceof TypeError) && error.name !== "AbortError") {
        onlyNetworkErrors = false;
      }
    }
  }
  throw new Error(onlyNetworkErrors ? "network" : "failed");
}

// 입력창이 비어 있으면 [단축하기]를 비활성화
input.addEventListener("input", () => {
  shortenButton.disabled = !input.value.trim();
});

// [단축하기]를 누르거나 Enter를 치면 OpenAPI로 단축을 요청하고 결과를 출력 상자에 보여 줌
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!input.value.trim()) {
    return;
  }

  // 한글 자음·모음(예: ㅈㅈㅈ)이 섞여 있으면 한/영 키가 한글로 되어 있는 경우가 많음
  if (/[ㄱ-ㅎㅏ-ㅣ]/.test(input.value)) {
    showMessage("한/영 키를 확인해 주세요. 주소는 영문으로 입력해야 합니다.");
    input.focus();
    return;
  }

  const longUrl = normalizeUrl(input.value);
  if (!longUrl) {
    showMessage("올바른 웹사이트 주소를 입력해 주세요. (예: www.sdu.ac.kr)");
    input.focus();
    return;
  }

  showMessage("");
  result.value = "";
  copyButton.disabled = true;
  shortenButton.disabled = true;
  shortenButton.textContent = "단축 중...";

  try {
    result.value = await shortenUrl(longUrl);
    copyButton.disabled = false;
  } catch (error) {
    showMessage(error.message === "network"
      ? "네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요."
      : "URL을 단축하지 못했습니다. 주소를 확인하거나 잠시 후 다시 시도해 주세요.");
  } finally {
    shortenButton.textContent = "단축하기";
    shortenButton.disabled = !input.value.trim();
  }
});

// [복사]를 누르면 단축된 URL을 복사하고 '복사하였습니다' 알림을 보여 줌
copyButton.addEventListener("click", async () => {
  if (!result.value) {
    return;
  }
  try {
    await navigator.clipboard.writeText(result.value);
  } catch (error) {
    // 클립보드 기능을 쓸 수 없는 환경이면 예전 방식으로 복사
    result.select();
    if (!document.execCommand("copy")) {
      showMessage("복사하지 못했습니다. 출력 상자의 주소를 직접 선택해서 복사해 주세요.");
      return;
    }
  }
  showToast("복사하였습니다");
});
