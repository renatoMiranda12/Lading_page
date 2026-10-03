// Adicione a URL do checkout de pagamento parcelado entre as aspas.
const INSTALLMENT_REDIRECT_URL = "";
// Configure os dados reais de pagamento somente no ambiente de produção.
const PIX_COPY_PASTE = "";
//Adicione a URL da imagem do QR Code do Pix entre as aspas.
const PIX_QR_CODE_IMAGE = "";
const heroVideo = document.querySelector(".hero-video");
const hero = document.querySelector(".hero");
const muteButton = document.querySelector(".video-mute");
const volumeControl = document.querySelector("#video-volume");
const interestDialog = document.querySelector("#interest-dialog");
const interestForm = document.querySelector("#interest-form");
const interestStatus = document.querySelector("#interest-form-status");
const interestSubmit = interestForm.querySelector("[type='submit']");
const originalSubmitLabel = interestSubmit.textContent;
const registrationFields = interestForm.querySelector(".interest-registration-fields");
const pixPaymentDetails = document.querySelector("#pix-payment-details");
const pixQrCode = document.querySelector("#pix-qr-code");
const pixCopyPaste = document.querySelector("#pix-copy-paste");
const pixCopyLabel = document.querySelector("#pix-copy-label");
const pixCopyButton = document.querySelector("#pix-copy-button");
const pixCopyStatus = document.querySelector("#pix-copy-status");
let controlsHideTimer;

function showVideoControls() {
    if (!window.matchMedia("(min-width: 701px) and (hover: hover)").matches) {
        return;
    }

    hero.classList.add("video-controls-visible");
    clearTimeout(controlsHideTimer);
    controlsHideTimer = setTimeout(() => {
        if (!hero.matches(":focus-within")) {
            hero.classList.remove("video-controls-visible");
        }
    }, 800);
}

hero.addEventListener("mouseenter", showVideoControls);
hero.addEventListener("mousemove", showVideoControls);

function syncMuteUI() {
    const isMuted = heroVideo.muted || heroVideo.volume === 0;
    muteButton.setAttribute("aria-label", isMuted ? "Ativar som" : "Desativar som");
    muteButton.setAttribute("aria-pressed", String(!isMuted));
}

// Autoplay começa mutado (exigência dos navegadores). Assim que o
// visitante interagir com a página, tentamos deixar o vídeo tocando.
document.addEventListener("pointerdown", () => {
    heroVideo.play().catch(() => { });
}, { once: true, passive: true });

muteButton.addEventListener("click", () => {
    heroVideo.muted = !heroVideo.muted;
    if (!heroVideo.muted && heroVideo.volume === 0) {
        heroVideo.volume = 1;
        volumeControl.value = "1";
    }
    heroVideo.play().catch(() => { });
    syncMuteUI();
});

volumeControl.addEventListener("input", () => {
    heroVideo.volume = Number(volumeControl.value);
    heroVideo.muted = heroVideo.volume === 0;
    syncMuteUI();
});

syncMuteUI();

document.querySelector(".investment-cta[aria-controls='interest-dialog']")
    .addEventListener("click", () => interestDialog.showModal());

interestDialog.querySelector(".interest-dialog-close")
    .addEventListener("click", () => interestDialog.close());

interestDialog.addEventListener("click", (event) => {
    if (event.target === interestDialog) {
        interestDialog.close();
    }
});

pixCopyButton.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(pixCopyPaste.value);
        pixCopyStatus.textContent = "Código Pix copiado.";
    } catch {
        pixCopyStatus.textContent = "Não foi possível copiar automaticamente. Selecione e copie o código acima.";
        pixCopyPaste.focus();
        pixCopyPaste.select();
    }
});

interestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    interestStatus.textContent = "";

    const paymentMethod = interestForm.elements.payment_method.value;
    let paymentUrl = null;
    if (paymentMethod === "installments" && INSTALLMENT_REDIRECT_URL.trim()) {
        try {
            paymentUrl = new URL(INSTALLMENT_REDIRECT_URL);
            if (!["http:", "https:"].includes(paymentUrl.protocol)) {
                throw new Error();
            }
        } catch {
            interestStatus.textContent = "O link em INSTALLMENT_REDIRECT_URL precisa ser uma URL http ou https válida.";
            return;
        }
    }

    interestSubmit.disabled = true;
    interestSubmit.textContent = "ENVIANDO...";

    try {
        const response = await fetch("api/register-interest.php", {
            method: "POST",
            body: new FormData(interestForm),
            headers: { Accept: "application/json" }
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Não foi possível salvar seus dados. Tente novamente.");
        }

        if (paymentUrl) {
            window.location.assign(paymentUrl.href);
            return;
        }

        if (paymentMethod === "installments") {
            interestStatus.textContent = "Cadastro salvo. O link para pagamento parcelado será disponibilizado em breve.";
            interestSubmit.textContent = "CADASTRO SALVO";
            interestSubmit.disabled = true;
            return;
        }

        if (PIX_COPY_PASTE.trim()) {
            pixCopyPaste.value = PIX_COPY_PASTE.trim();
            pixCopyPaste.hidden = false;
            pixCopyLabel.hidden = false;
            pixCopyButton.hidden = false;
        }
        if (PIX_QR_CODE_IMAGE.trim()) {
            pixQrCode.src = PIX_QR_CODE_IMAGE.trim();
            pixQrCode.hidden = false;
        }

        if (PIX_COPY_PASTE.trim() || PIX_QR_CODE_IMAGE.trim()) {
            registrationFields.hidden = true;
            interestStatus.textContent = "Cadastro salvo. Use os dados abaixo para concluir o pagamento.";
            interestSubmit.hidden = true;
            pixPaymentDetails.hidden = false;
        } else {
            interestStatus.textContent = "Cadastro salvo. O código Pix para pagamento à vista ainda precisa ser configurado.";
            interestSubmit.textContent = "CADASTRO SALVO";
            interestSubmit.disabled = true;
        }
    } catch (error) {
        interestStatus.textContent = error.message || "Não foi possível salvar seus dados. Tente novamente.";
        interestSubmit.disabled = false;
        interestSubmit.textContent = originalSubmitLabel;
    }
});
