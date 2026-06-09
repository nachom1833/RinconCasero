/* Rincón Casero Platform - Interactive Controller */

// 1. Database of products and pricing
const PRODUCTS = {
    "chipa": {
        name: "Chipa Tradicional de Queso",
        basePrice: 450,
        allowedStates: ["Congelado y Crudo", "Cocido"]
    },
    "pan-casero": {
        name: "Pan Casero Rústico",
        basePrice: 1200,
        allowedStates: ["Congelado y Cocido"]
    },
    "pan-semillas": {
        name: "Pan Multisemillas Premium",
        basePrice: 1400,
        allowedStates: ["Congelado y Crudo", "Cocido"]
    },
    "cookies": {
        name: "Cookies Americanas con Chips",
        basePrice: 350,
        allowedStates: ["Congelado y Crudo", "Cocido"] // Cookies don't have "Precocido"
    },
    "scones": {
        name: "Scones Artesanales",
        basePrice: 400,
        allowedStates: ["Congelado y Crudo", "Cocido"] // Scones don't have "Precocido"
    }
};

// Target WhatsApp phone number (Default placeholder)
const WHATSAPP_PHONE = "+5491136281564";

// 2. Global state references
const productSelect = document.getElementById("form-producto");
const quantityInput = document.getElementById("form-cantidad");
const quantitySlider = document.getElementById("form-cantidad-slider");
const qtyBadge = document.getElementById("qty-badge-value");
const precocidoWrapper = document.getElementById("precocido-wrapper");
const radioPrecocidoInput = precocidoWrapper ? precocidoWrapper.querySelector('input[value="Precocido"]') : null;

// Summary Elements
const resPrecioLista = document.getElementById("res-precio-lista");
const resDescuento = document.getElementById("res-descuento");
const resPrecioUnitario = document.getElementById("res-precio-unitario");
const resTotal = document.getElementById("res-total");

// Logo Elements
const clientLogoImg = document.getElementById("client-logo-img");
const logoPlaceholderMsg = document.getElementById("logo-placeholder-msg");
const clientLogoPreviewBox = document.getElementById("client-logo-preview-box");
const uploadStatusText = document.getElementById("upload-status-text");

// 3. Document ready initializations
document.addEventListener("DOMContentLoaded", () => {
    // Initial calculation based on form default values
    updateCalculations();
});

// Helper: Select product from catalog click
function selectProductInCalculator(productId) {
    if (productSelect && PRODUCTS[productId]) {
        productSelect.value = productId;
        updateCalculations();
        
        // Scroll smoothly to cotizador
        const targetSection = document.getElementById("cotizador");
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// 4. Quantity synchronization logic
function syncQtyInput(value) {
    let numValue = parseInt(value) || 1;
    if (numValue < 1) numValue = 1;
    if (numValue > 2000) numValue = 2000;
    
    quantityInput.value = numValue;
    qtyBadge.innerText = numValue + " uds";
    updateCalculations();
}

function modifyQty(amount) {
    let current = parseInt(quantityInput.value) || 25;
    let next = current + amount;
    
    if (next < 1) next = 1;
    if (next > 2000) next = 2000;
    
    quantityInput.value = next;
    quantitySlider.value = Math.min(next, 500); // Slider caps visually at 500 for better step resolution
    qtyBadge.innerText = next + " uds";
    updateCalculations();
}

// Ensure direct input typing updates correctly
if (quantityInput) {
    quantityInput.addEventListener('change', () => {
        let val = parseInt(quantityInput.value) || 25;
        if (val < 1) val = 1;
        if (val > 2000) val = 2000;
        
        quantityInput.value = val;
        quantitySlider.value = Math.min(val, 500);
        qtyBadge.innerText = val + " uds";
        updateCalculations();
    });
}

// 5. Tiered pricing and UI compilation
function updateCalculations() {
    const selectedKey = productSelect.value;
    const product = PRODUCTS[selectedKey];
    
    if (!product) return;

    // A. Check if the product supports Precocido state
    const supportsPrecocido = product.allowedStates.includes("Precocido");
    if (!supportsPrecocido) {
        // Hide/disable the option
        precocidoWrapper.style.opacity = "0.3";
        precocidoWrapper.style.pointerEvents = "none";
        
        // If Precocido was selected, fall back to "Congelado"
        const currentSelectedState = document.querySelector('input[name="form-estado"]:checked');
        if (currentSelectedState && currentSelectedState.value === "Precocido") {
            const congeladoRadio = document.querySelector('input[name="form-estado"][value="Congelado"]');
            if (congeladoRadio) {
                congeladoRadio.checked = true;
            }
        }
    } else {
        // Restore styling
        precocidoWrapper.style.opacity = "1";
        precocidoWrapper.style.pointerEvents = "auto";
    }

    // B. Calculate discount tier based on quantity
    const quantity = parseInt(quantityInput.value) || 0;
    let discountPercent = 0;
    let discountText = "0% (Lista Mayorista)";
    
    if (quantity >= 50 && quantity < 100) {
        discountPercent = 10;
        discountText = "10% de Descuento";
        resDescuento.className = "discount-pill has-discount";
    } else if (quantity >= 100) {
        discountPercent = 20;
        discountText = "20% de Descuento (Volumen)";
        resDescuento.className = "discount-pill has-discount";
    } else {
        resDescuento.className = "discount-pill";
    }

    // C. Pricing calculations
    const basePrice = product.basePrice;
    const discountAmount = (basePrice * discountPercent) / 100;
    const netUnitPrice = basePrice - discountAmount;
    const totalCost = netUnitPrice * quantity;

    // D. Format Currency (Spanish locale format)
    const formatter = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    });

    // E. Print to UI
    resPrecioLista.innerText = formatter.format(basePrice) + " c/u";
    resDescuento.innerText = discountText;
    resPrecioUnitario.innerText = formatter.format(netUnitPrice) + " c/u";
    resTotal.innerText = formatter.format(totalCost);
}

// 6. Handle quote form submission and WhatsApp lead generation
function handleQuoteSubmit(event) {
    event.preventDefault();

    const selectedKey = productSelect.value;
    const product = PRODUCTS[selectedKey];
    const state = document.querySelector('input[name="form-estado"]:checked').value;
    const qty = parseInt(quantityInput.value) || 0;

    // Recalculate values securely for the message
    let discountPercent = 0;
    if (qty >= 50 && qty < 100) discountPercent = 10;
    if (qty >= 100) discountPercent = 20;

    const basePrice = product.basePrice;
    const netUnit = basePrice - (basePrice * discountPercent / 100);
    const total = netUnit * qty;

    const formatter = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    });

    const formattedUnit = formatter.format(netUnit);
    const formattedTotal = formatter.format(total);

    // Build persuasive lead text
    let message = `Hola Rincón Casero, vengo de la web corporativa. Quiero consultar sobre el siguiente pedido mayorista:\n\n`;
    message += `• *Producto:* ${product.name}\n`;
    message += `• *Estado de Entrega:* ${state}\n`;
    message += `• *Cantidad:* ${qty} unidades\n`;
    
    if (discountPercent > 0) {
        message += `• *Descuento Aplicado:* ${discountPercent}%\n`;
    }
    
    message += `• *Costo Estimado:* ${formattedTotal} (precio neto unitario: ${formattedUnit})\n\n`;
    message += `¿Cuáles son los días de reparto disponibles para este pedido y los pasos para coordinar la entrega? Muchas gracias.`;

    // Encode message for WhatsApp link
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`;

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
}

// 7. White-Label file reader preview logic
function loadLogoFile(event) {
    const file = event.target.files[0];
    
    if (!file) return;

    // Validate that the file is an image
    if (!file.type.startsWith('image/')) {
        alert("Por favor, selecciona un archivo de imagen válido (.png o .jpg)");
        return;
    }

    const reader = new FileReader();
    
    reader.onload = function(e) {
        // Set preview source to the base64 URL
        clientLogoImg.src = e.target.result;
        clientLogoImg.style.display = "block";
        
        // Hide placeholder message
        logoPlaceholderMsg.style.display = "none";
        
        // Add styling states
        clientLogoPreviewBox.classList.add("has-logo");
        uploadStatusText.innerText = "¡Logo cargado! (" + file.name.substring(0, 15) + "...)";
        uploadStatusText.style.color = "var(--color-primary-hover)";
    };

    reader.readAsDataURL(file);
}

// 8. White-Label WhatsApp redirection
function requestWhiteLabelWhatsApp() {
    let message = `Hola Rincón Casero! Me interesa conocer más detalles sobre el servicio de empaque personalizado de Cookies con Marca Propia (Marca Blanca).\n\n`;
    message += `Cumplo con el requisito de pedido mayorista superior a 100 unidades y me gustaría saber cómo enviarles el logotipo en alta definición para la maqueta y la producción.\n\n`;
    message += `Quedo al aguardo de su respuesta comercial para coordinar. ¡Saludos!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
}
