// ==========================================================
// Money Statistics - Shared Session Manager
// 工作階段：30 分鐘
// ==========================================================

const MONEY_STATISTICS_SESSION_KEY =
    "moneyStatisticsSessionExpire";

const SESSION_DURATION =
    30 * 60 * 1000;


// ==========================================================
// 取得登入頁面網址
// ==========================================================

function getLoginPageUrl() {

    return "/MoneyStatisticsAPI/login.html";
}


// ==========================================================
// 建立 30 分鐘工作階段
// ==========================================================

function startMoneyStatisticsSession() {

    const expireTime =
        Date.now() + SESSION_DURATION;

    sessionStorage.setItem(
        MONEY_STATISTICS_SESSION_KEY,
        expireTime.toString()
    );

    return expireTime;
}


// ==========================================================
// 取得工作階段到期時間
// ==========================================================

function getMoneyStatisticsSessionExpire() {

    const value =
        sessionStorage.getItem(
            MONEY_STATISTICS_SESSION_KEY
        );

    if (!value) {
        return null;
    }

    const expireTime =
        Number(value);

    if (!Number.isFinite(expireTime)) {
        return null;
    }

    return expireTime;
}


// ==========================================================
// 清除工作階段
// ==========================================================

function clearMoneyStatisticsSession() {

    sessionStorage.removeItem(
        MONEY_STATISTICS_SESSION_KEY
    );
}


// ==========================================================
// 工作階段結束視窗
// ==========================================================

function showSessionExpiredModal() {

    // 避免重複建立
    if (document.getElementById("moneyStatisticsSessionModal")) {
        return;
    }

    const overlay =
        document.createElement("div");

    overlay.id =
        "moneyStatisticsSessionModal";

    overlay.innerHTML = `
        <div class="ms-session-modal">

            <div class="ms-session-title">
                工作階段已結束
            </div>

            <div class="ms-session-message">
                為了保護您的帳號安全，目前的工作階段已經結束。
                <br><br>
                請重新登入 Money Statistics 後繼續使用。
            </div>

            <button
                id="msSessionConfirmButton"
                class="ms-session-button">
                確定
            </button>

        </div>
    `;


    document.body.appendChild(overlay);


    // ======================================================
    // 按下「確定」
    // ======================================================

    document
        .getElementById("msSessionConfirmButton")
        .addEventListener(
            "click",
            async function () {

                const button =
                    this;

                button.disabled =
                    true;

                button.textContent =
                    "登出中…";


                try {

                    await supabaseClient.auth.signOut();

                } catch (error) {

                    console.error(
                        "Supabase signOut error:",
                        error
                    );

                }


                clearMoneyStatisticsSession();


                window.location.href =
                    getLoginPageUrl();

            }
        );
}


// ==========================================================
// 工作階段到期處理
// ==========================================================

let moneyStatisticsSessionExpired =
    false;


function expireMoneyStatisticsSession() {

    if (moneyStatisticsSessionExpired) {
        return;
    }

    moneyStatisticsSessionExpired =
        true;


    clearMoneyStatisticsSession();


    showSessionExpiredModal();
}


// ==========================================================
// 檢查工作階段
// ==========================================================

function checkMoneyStatisticsSession() {

    if (moneyStatisticsSessionExpired) {
        return;
    }


    const expireTime =
        getMoneyStatisticsSessionExpire();


    // ------------------------------------------------------
    // 沒有工作階段
    // ------------------------------------------------------

    if (!expireTime) {

        return;

    }


    // ------------------------------------------------------
    // 已經到期
    // ------------------------------------------------------

    if (Date.now() >= expireTime) {

        expireMoneyStatisticsSession();

    }

}


// ==========================================================
// 初始化工作階段
// ==========================================================

async function initializeMoneyStatisticsSession() {

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();


        // --------------------------------------------------
        // Supabase Session 發生錯誤
        // --------------------------------------------------

        if (error) {

            console.error(
                "取得 Supabase Session 失敗：",
                error
            );

            return;

        }


        // --------------------------------------------------
        // 沒有登入
        // --------------------------------------------------

        if (!data.session) {

            clearMoneyStatisticsSession();

            window.location.href =
                getLoginPageUrl();

            return;

        }


        // --------------------------------------------------
        // 有 Supabase Session
        // 但沒有 Money Statistics 工作階段
        // --------------------------------------------------

        const expireTime =
            getMoneyStatisticsSessionExpire();


        if (!expireTime) {

            console.warn(
                "找不到 Money Statistics 工作階段。"
            );

            clearMoneyStatisticsSession();

            await supabaseClient.auth.signOut();

            window.location.href =
                getLoginPageUrl();

            return;

        }


        // --------------------------------------------------
        // 工作階段已經到期
        // --------------------------------------------------

        if (Date.now() >= expireTime) {

            expireMoneyStatisticsSession();

            return;

        }


        // --------------------------------------------------
        // 開始定期檢查
        // --------------------------------------------------

        setInterval(
            checkMoneyStatisticsSession,
            1000
        );


        // --------------------------------------------------
        // 瀏覽器重新進入頁面時再次檢查
        // --------------------------------------------------

        document.addEventListener(
            "visibilitychange",
            function () {

                if (
                    document.visibilityState ===
                    "visible"
                ) {

                    checkMoneyStatisticsSession();

                }

            }
        );


    } catch (error) {

        console.error(
            "Session 初始化失敗：",
            error
        );

    }

}


// ==========================================================
// Session Modal CSS
// ==========================================================

const sessionStyle =
    document.createElement("style");

sessionStyle.textContent = `

    #moneyStatisticsSessionModal {

        position: fixed;

        top: 0;
        left: 0;

        width: 100%;
        height: 100%;

        background: rgba(0, 0, 0, 0.35);

        display: flex;

        align-items: center;
        justify-content: center;

        z-index: 999999;

        padding: 20px;

        box-sizing: border-box;

    }


    .ms-session-modal {

        width: 100%;
        max-width: 420px;

        background: #ffffff;

        border-radius: 24px;

        padding: 32px;

        box-sizing: border-box;

        box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.20);

        text-align: center;

        font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

    }


    .ms-session-title {

        font-size: 22px;

        font-weight: 600;

        color: #1d1d1f;

        margin-bottom: 16px;

    }


    .ms-session-message {

        font-size: 15px;

        line-height: 1.7;

        color: #6e6e73;

        margin-bottom: 28px;

    }


    .ms-session-button {

        width: 100%;

        border: none;

        border-radius: 12px;

        background: #007aff;

        color: #ffffff;

        font-size: 16px;

        font-weight: 500;

        padding: 12px 20px;

        cursor: pointer;

    }


    .ms-session-button:hover {

        background: #006fe6;

    }


    .ms-session-button:disabled {

        opacity: 0.6;

        cursor: default;

    }

`;

document.head.appendChild(
    sessionStyle
);


// ==========================================================
// 啟動
// ==========================================================

initializeMoneyStatisticsSession();
