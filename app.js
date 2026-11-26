(function () {
  'use strict';

  /* ================= GLOBAL UTILITIES ================= */
  const FONT_LABELS = {
    1: '기본 글씨',
    2: '큰 글씨',
    3: '매우 큰 글씨'
  };

  function formatWon(num) {
    return Number(num || 0).toLocaleString('ko-KR') + '원';
  }

  function randomOrderCode(prefix) {
    const num = Math.floor(100 + Math.random() * 899);
    return prefix + '-' + num;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ================= FONT SIZE CONTROLLER ================= */
  const headerFontSlider = document.getElementById('headerFontSlider');
  const homeFontSlider = document.getElementById('homeFontSlider');
  const headerFontBadge = document.getElementById('headerFontBadge');
  const homeFontBadge = document.getElementById('homeFontBadge');
  const fontPresetBtns = document.querySelectorAll('[data-font-preset]');

  function applyFontSize(level) {
    const lvl = Math.min(3, Math.max(1, Number(level) || 1));
    document.documentElement.setAttribute('data-font-size', String(lvl));
    headerFontSlider.value = String(lvl);
    homeFontSlider.value = String(lvl);
    headerFontBadge.textContent = FONT_LABELS[lvl];
    homeFontBadge.textContent = FONT_LABELS[lvl];
    fontPresetBtns.forEach(function (btn) {
      btn.classList.toggle('active', Number(btn.dataset.fontPreset) === lvl);
    });
  }

  headerFontSlider.addEventListener('input', function (e) {
    applyFontSize(e.target.value);
  });
  homeFontSlider.addEventListener('input', function (e) {
    applyFontSize(e.target.value);
  });
  fontPresetBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyFontSize(btn.dataset.fontPreset);
    });
  });

  /* ================= VIEW NAVIGATION ================= */
  const views = {
    home: document.getElementById('view-home'),
    guide: document.getElementById('view-guide'),
    about: document.getElementById('view-about'),
    kiosk: document.getElementById('view-kiosk')
  };

  function showView(viewKey) {
    Object.keys(views).forEach(function (k) {
      views[k].classList.toggle('active', k === viewKey);
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  document.getElementById('brandHomeBtn').addEventListener('click', function () {
    showView('home');
  });
  document.getElementById('openGuideBtn').addEventListener('click', function () {
    showView('guide');
  });
  document.getElementById('openAboutBtn').addEventListener('click', function () {
    showView('about');
  });
  document.querySelectorAll('[data-go-home]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showView('home');
    });
  });

  /* ================= SHARED KIOSK ENGINE ================= */
  const kioskModeTitle = document.getElementById('kioskModeTitle');
  const kioskStepCounter = document.getElementById('kioskStepCounter');
  const kioskStepTrack = document.getElementById('kioskStepTrack');
  const kioskTeacherText = document.getElementById('kioskTeacherText');
  const kioskValidationAlert = document.getElementById('kioskValidationAlert');
  const kioskValidationText = document.getElementById('kioskValidationText');
  const kioskDynamicContainer = document.getElementById('kioskDynamicContainer');
  const kioskNavBar = document.getElementById('kioskNavBar');
  const kioskPrevBtn = document.getElementById('kioskPrevBtn');
  const kioskNextBtn = document.getElementById('kioskNextBtn');
  const kioskResetBtn = document.getElementById('kioskResetBtn');
  const kioskHomeBtn = document.getElementById('kioskHomeBtn');

  const KIOSK_MODULES = {};
  let currentKioskKey = null;

  function hideValidation() {
    kioskValidationAlert.classList.remove('show');
    kioskValidationText.textContent = '';
  }

  function showValidation(msg) {
    kioskValidationText.textContent = msg;
    kioskValidationAlert.classList.add('show');
    kioskValidationAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function renderActiveKiosk() {
    const mod = KIOSK_MODULES[currentKioskKey];
    if (!mod) return;
    hideValidation();

    const meta = mod.getMeta();
    kioskModeTitle.textContent = meta.title;
    kioskStepCounter.textContent = (meta.stepIndex + 1) + '단계 / ' + meta.steps.length + '단계';
    kioskTeacherText.textContent = meta.teacherMessage;

    kioskStepTrack.innerHTML = meta.steps.map(function (label, idx) {
      let cls = 'step-dot-item';
      if (idx < meta.stepIndex) cls += ' done';
      else if (idx === meta.stepIndex) cls += ' current';
      const prefix = idx < meta.stepIndex ? '✓ ' : (idx + 1) + '. ';
      return '<span class="' + cls + '">' + prefix + escapeHtml(label) + '</span>';
    }).join('');

    kioskDynamicContainer.innerHTML = mod.render();
    if (typeof mod.bindEvents === 'function') {
      mod.bindEvents(kioskDynamicContainer);
    }

    const isResult = Boolean(meta.isResult);
    kioskNavBar.style.display = isResult ? 'none' : 'flex';
    kioskPrevBtn.style.display = meta.stepIndex === 0 ? 'none' : 'inline-flex';
    kioskNextBtn.style.display = meta.hideNextButton ? 'none' : 'inline-flex';
    kioskNextBtn.textContent = meta.nextLabel || '다음 단계 →';
  }

  function startKiosk(key) {
    if (!KIOSK_MODULES[key]) return;
    currentKioskKey = key;
    KIOSK_MODULES[key].reset();
    showView('kiosk');
    renderActiveKiosk();
  }

  kioskPrevBtn.addEventListener('click', function () {
    const mod = KIOSK_MODULES[currentKioskKey];
    if (mod && typeof mod.prev === 'function') {
      mod.prev();
      renderActiveKiosk();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  kioskNextBtn.addEventListener('click', function () {
    const mod = KIOSK_MODULES[currentKioskKey];
    if (mod && typeof mod.next === 'function') {
      const error = mod.next();
      if (error) {
        showValidation(error);
      } else {
        renderActiveKiosk();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  });

  kioskResetBtn.addEventListener('click', function () {
    if (currentKioskKey && KIOSK_MODULES[currentKioskKey]) {
      KIOSK_MODULES[currentKioskKey].reset();
      renderActiveKiosk();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  kioskHomeBtn.addEventListener('click', function () {
    showView('home');
  });

  document.querySelectorAll('[data-start-kiosk]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      startKiosk(btn.dataset.startKiosk);
    });
  });

  /* ===== SHARED PAYMENT TERMINAL HELPER ===== */
  function renderCardPaymentStep(opts) {
    const isCard = opts.paymentMethod === 'card';
    const inserted = Boolean(opts.cardInserted);
    return (
      '<div class="kiosk-screen-frame">' +
        '<div class="kiosk-machine-header ' + opts.themeClass + '">' +
          '<div class="kiosk-machine-brand">' + escapeHtml(opts.brandName) + ' · 모의 결제</div>' +
          '<span class="kiosk-machine-tag">연습용 결제</span>' +
        '</div>' +
        '<div class="kiosk-screen-body">' +
          '<h2 class="step-heading">모의 결제를 진행해 주세요</h2>' +
          '<p class="step-sub">실제로 돈이 빠져나가지 않는 안전한 연습 화면입니다.</p>' +
          '<div class="total-price-bar" style="margin-top:0; margin-bottom:20px;">' +
            '<span class="total-price-label">연습용 총 결제 금액</span>' +
            '<span class="total-price-amount">' + formatWon(opts.totalAmount) + '</span>' +
          '</div>' +
          '<div class="card-terminal-box">' +
            '<div style="font-size:1.12rem; font-weight:900; color:var(--royal-blue);">' +
              (isCard ? '신용·체크카드 가상 단말기' : '모바일 간편결제 가상 인식기') +
            '</div>' +
            '<div class="card-slot-visual ' + (inserted ? 'inserted' : '') + '">' +
              (isCard
                ? '<svg width="110" height="78" viewBox="0 0 110 78" fill="none" aria-hidden="true">' +
                    '<rect x="6" y="10" width="98" height="58" rx="10" fill="' + (inserted ? '#287A4B' : '#2458A6') + '"/>' +
                    '<rect x="6" y="22" width="98" height="10" fill="#172B4D"/>' +
                    '<rect x="18" y="42" width="22" height="15" rx="3" fill="#F5CF69"/>' +
                    '<rect x="52" y="46" width="38" height="7" rx="3" fill="#DCEBFC"/>' +
                  '</svg>'
                : '<svg width="110" height="78" viewBox="0 0 110 78" fill="none" aria-hidden="true">' +
                    '<rect x="33" y="6" width="44" height="66" rx="8" fill="' + (inserted ? '#287A4B' : '#2458A6') + '"/>' +
                    '<rect x="39" y="14" width="32" height="44" rx="4" fill="#FFFFFF"/>' +
                    '<rect x="44" y="24" width="4" height="22" fill="#172B4D"/>' +
                    '<rect x="51" y="24" width="2" height="22" fill="#172B4D"/>' +
                    '<rect x="56" y="24" width="5" height="22" fill="#172B4D"/>' +
                    '<rect x="64" y="24" width="3" height="22" fill="#172B4D"/>' +
                  '</svg>'
              ) +
              '<div style="margin-top:10px; font-weight:900; font-size:1.05rem; color:' + (inserted ? 'var(--green-dark)' : 'var(--text-navy)') + ';">' +
                (inserted
                  ? '✓ 연습용 카드 인식이 완료되었습니다!'
                  : (isCard ? '아래 버튼을 눌러 가상의 카드를 투입해 주세요.' : '아래 버튼을 눌러 가상의 바코드를 대어 주세요.')) +
              '</div>' +
            '</div>' +
            (!inserted
              ? '<button type="button" class="btn btn-yellow" id="virtualCardInsertBtn" style="width:100%; max-width:380px; min-height:66px; font-size:1.15rem;">' +
                  (isCard ? '연습용 카드 투입하기' : '연습용 모바일 결제 대보기') +
                '</button>'
              : '<button type="button" class="btn btn-success" id="virtualCardCompleteBtn" style="width:100%; max-width:380px; min-height:66px; font-size:1.15rem;">' +
                  escapeHtml(opts.completeButtonLabel || '결제 완료하고 결과 확인하기 →') +
                '</button>') +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* ================= 1. CAFE KIOSK MODULE ================= */
  const CAFE_DRINKS = [
    { id: 'americano', name: '아메리카노', price: 3500, desc: '깔끔하고 고소한 기본 커피', liquid: '#5C3A21', foam: '#8B5E3C', accent: '#DCEBFC' },
    { id: 'cafelatte', name: '카페라떼', price: 4200, desc: '부드러운 우유가 들어간 커피', liquid: '#B58459', foam: '#FFF8EE', accent: '#E8D5C4' },
    { id: 'vanillalatte', name: '바닐라라떼', price: 4700, desc: '달콤한 바닐라 향 라떼', liquid: '#C99A6B', foam: '#FFF6DC', accent: '#F5CF69' },
    { id: 'cappuccino', name: '카푸치노', price: 4300, desc: '풍성한 우유 거품 커피', liquid: '#9E6B43', foam: '#FFFFFF', accent: '#D8B384' },
    { id: 'strawberry', name: '딸기주스', price: 5000, desc: '상큼달콤한 딸기 음료', liquid: '#E2556F', foam: '#FFD3DC', accent: '#287A4B' },
    { id: 'chocolatte', name: '초코라떼', price: 4500, desc: '진하고 달콤한 코코아 음료', liquid: '#6B3E26', foam: '#D2A68C', accent: '#F5CF69' },
    { id: 'yujatea', name: '유자차', price: 4500, desc: '향긋하고 달콤한 유자차', liquid: '#F2B938', foam: '#FFF2B2', accent: '#E0921B' },
    { id: 'greentea', name: '녹차', price: 4000, desc: '은은하고 개운한 전통 녹차', liquid: '#589C5F', foam: '#D8F2D6', accent: '#287A4B' }
  ];

  function renderDrinkSvg(drink) {
    return (
      '<svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">' +
        '<rect x="18" y="20" width="32" height="40" rx="7" fill="' + drink.liquid + '" stroke="#172B4D" stroke-width="2.5"/>' +
        '<path d="M18 27C18 23.2 21 20 25 20H43C47 20 50 23.2 50 27V30H18V27Z" fill="' + drink.foam + '"/>' +
        '<path d="M50 27H55C58.3 27 61 29.7 61 33C61 36.3 58.3 39 55 39H50" stroke="#172B4D" stroke-width="3" stroke-linecap="round"/>' +
        '<rect x="14" y="58" width="40" height="5" rx="2.5" fill="#91BDF2"/>' +
        '<circle cx="34" cy="43" r="6" fill="' + drink.accent + '" opacity="0.9"/>' +
        '<path d="M26 14C26 11.5 28 10.5 28 8M34 14C34 11.5 36 10.5 36 8M42 14C42 11.5 44 10.5 44 8" stroke="#91BDF2" stroke-width="2.5" stroke-linecap="round"/>' +
      '</svg>'
    );
  }

  const CAFE_STEPS = [
    '매장·포장',
    '음료 선택',
    '옵션 선택',
    '수량 선택',
    '장바구니 확인',
    '결제 방법',
    '모의 결제',
    '주문 완료'
  ];

  const cafeState = {
    step: 0,
    dining: null, // 'dine_in' | 'take_out'
    selectedDrinkId: null,
    temp: null, // 'hot' | 'ice'
    size: null, // 'regular' | 'large'
    qty: 1,
    editingIndex: null,
    cart: [],
    paymentMethod: null, // 'card' | 'mobile'
    cardInserted: false,
    orderNumber: ''
  };

  function getCafeDrink(id) {
    return CAFE_DRINKS.find(function (d) { return d.id === id; }) || null;
  }

  function getCafeItemUnitPrice(drink, size) {
    return (drink ? drink.price : 0) + (size === 'large' ? 500 : 0);
  }

  function getCafeCartTotal() {
    return cafeState.cart.reduce(function (sum, item) {
      return sum + item.unitPrice * item.qty;
    }, 0);
  }

  function resetCafeDraft() {
    cafeState.selectedDrinkId = null;
    cafeState.temp = null;
    cafeState.size = null;
    cafeState.qty = 1;
    cafeState.editingIndex = null;
  }

  KIOSK_MODULES.cafe = {
    reset: function () {
      cafeState.step = 0;
      cafeState.dining = null;
      resetCafeDraft();
      cafeState.cart = [];
      cafeState.paymentMethod = null;
      cafeState.cardInserted = false;
      cafeState.orderNumber = '';
    },
    getMeta: function () {
      const guides = [
        '먼저 매장에서 드실지, 포장해서 가져가실지 큰 버튼 중 하나를 눌러 주세요.',
        '드시고 싶은 음료를 골라 눌러 주세요. 그림과 가격을 천천히 살펴보셔도 괜찮아요.',
        '따뜻한 음료와 차가운 음료 중 하나를 고르고, 컵 크기도 선택해 주세요.',
        '주문할 잔 수를 + 와 - 버튼으로 맞춰 주세요. 다 정하셨으면 장바구니에 담아 보아요.',
        '장바구니에 담긴 음료와 총금액을 확인해 주세요. 음료를 더 추가하거나 수량을 바꿀 수 있어요.',
        '결제 방법을 골라 주세요. 키오스크 연습에서는 신용·체크카드 결제를 추천해 드려요.',
        '이제 가상의 카드 투입 버튼을 눌러 모의 결제를 체험해 보세요. 실제 결제는 되지 않습니다.',
        '참 잘 하셨어요! 카페 키오스크 주문 연습을 훌륭하게 마치셨습니다.'
      ];
      const nextLabels = [
        '다음 단계 (음료 선택) →',
        '다음 단계 (옵션 선택) →',
        '다음 단계 (수량 선택) →',
        '장바구니에 담고 확인하기 →',
        '결제 방법 선택하기 →',
        '모의 결제 화면으로 →',
        '결제 완료하기 →',
        ''
      ];
      return {
        title: '카페 키오스크 주문 연습',
        steps: CAFE_STEPS,
        stepIndex: cafeState.step,
        teacherMessage: guides[cafeState.step],
        nextLabel: nextLabels[cafeState.step],
        isResult: cafeState.step === 7,
        hideNextButton: cafeState.step === 6 && !cafeState.cardInserted
      };
    },
    prev: function () {
      if (cafeState.step === 0) return;
      if (cafeState.step === 6) {
        cafeState.cardInserted = false;
      }
      cafeState.step -= 1;
    },
    next: function () {
      if (cafeState.step === 0) {
        if (!cafeState.dining) {
          return '매장에서 드실지, 포장하실지 먼저 선택해 주세요.';
        }
        cafeState.step = 1;
        return null;
      }
      if (cafeState.step === 1) {
        if (!cafeState.selectedDrinkId) {
          return '주문하실 음료를 하나 선택해 주세요.';
        }
        cafeState.step = 2;
        return null;
      }
      if (cafeState.step === 2) {
        if (!cafeState.temp && !cafeState.size) {
          return '음료 온도(따뜻한/차가운)와 음료 크기를 모두 선택해 주세요.';
        }
        if (!cafeState.temp) {
          return '따뜻한 음료인지 차가운 음료인지 선택해 주세요.';
        }
        if (!cafeState.size) {
          return '음료 크기(보통 크기 또는 큰 크기)를 선택해 주세요.';
        }
        cafeState.step = 3;
        return null;
      }
      if (cafeState.step === 3) {
        const drink = getCafeDrink(cafeState.selectedDrinkId);
        if (!drink) {
          cafeState.step = 1;
          return '음료를 다시 선택해 주세요.';
        }
        const unitPrice = getCafeItemUnitPrice(drink, cafeState.size);
        const newItem = {
          drinkId: drink.id,
          name: drink.name,
          temp: cafeState.temp,
          size: cafeState.size,
          qty: cafeState.qty,
          unitPrice: unitPrice
        };
        if (cafeState.editingIndex !== null && cafeState.cart[cafeState.editingIndex]) {
          cafeState.cart[cafeState.editingIndex] = newItem;
        } else {
          const existing = cafeState.cart.find(function (c) {
            return c.drinkId === newItem.drinkId && c.temp === newItem.temp && c.size === newItem.size;
          });
          if (existing) {
            existing.qty += newItem.qty;
          } else {
            cafeState.cart.push(newItem);
          }
        }
        resetCafeDraft();
        cafeState.step = 4;
        return null;
      }
      if (cafeState.step === 4) {
        if (cafeState.cart.length === 0) {
          return '장바구니가 비어 있어요. "음료 추가하기" 버튼을 눌러 음료를 담아 주세요.';
        }
        cafeState.step = 5;
        return null;
      }
      if (cafeState.step === 5) {
        if (!cafeState.paymentMethod) {
          return '결제 방법(신용·체크카드 결제 등)을 선택해 주세요.';
        }
        cafeState.cardInserted = false;
        cafeState.step = 6;
        return null;
      }
      if (cafeState.step === 6) {
        if (!cafeState.cardInserted) {
          return '먼저 화면 가운데의 "연습용 카드 투입하기" 버튼을 눌러 주세요.';
        }
        cafeState.orderNumber = randomOrderCode('C');
        cafeState.step = 7;
        return null;
      }
      return null;
    },
    render: function () {
      const s = cafeState.step;
      const diningLabel = cafeState.dining === 'dine_in' ? '매장에서 먹기' : (cafeState.dining === 'take_out' ? '포장하기' : '');

      if (s === 0) {
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-cafe">' +
              '<div class="kiosk-machine-brand">행복 카페 키오스크</div>' +
              '<span class="kiosk-machine-tag">1단계 · 이용 방법 선택</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<h2 class="step-heading">어디서 드실 건가요?</h2>' +
              '<p class="step-sub">매장에서 드실지, 포장해서 가져가실지 선택해 주세요.</p>' +
              '<div class="choice-grid-2">' +
                '<button type="button" class="choice-card ' + (cafeState.dining === 'dine_in' ? 'selected' : '') + '" data-cafe-dining="dine_in" style="min-height:210px;">' +
                  '<svg width="74" height="74" viewBox="0 0 72 72" fill="none" aria-hidden="true">' +
                    '<rect x="14" y="28" width="44" height="8" rx="4" fill="#2458A6"/>' +
                    '<rect x="33" y="36" width="6" height="22" rx="3" fill="#2458A6"/>' +
                    '<rect x="22" y="56" width="28" height="5" rx="2.5" fill="#91BDF2"/>' +
                    '<path d="M27 14H45V23C45 26 42.5 28 36 28C29.5 28 27 26 27 23V14Z" fill="#F5CF69" stroke="#172B4D" stroke-width="2.2"/>' +
                  '</svg>' +
                  '<span class="choice-title">매장에서 먹기</span>' +
                  '<span class="choice-sub">매장 안 자리에 앉아서 마셔요</span>' +
                '</button>' +
                '<button type="button" class="choice-card ' + (cafeState.dining === 'take_out' ? 'selected' : '') + '" data-cafe-dining="take_out" style="min-height:210px;">' +
                  '<svg width="74" height="74" viewBox="0 0 72 72" fill="none" aria-hidden="true">' +
                    '<path d="M22 24H50L46 60H26L22 24Z" fill="#DCEBFC" stroke="#2458A6" stroke-width="3" stroke-linejoin="round"/>' +
                    '<path d="M28 24V18C28 13.6 31.6 10 36 10C40.4 10 44 13.6 44 18V24" stroke="#2458A6" stroke-width="3" stroke-linecap="round"/>' +
                    '<rect x="29" y="34" width="14" height="16" rx="3" fill="#F5CF69"/>' +
                  '</svg>' +
                  '<span class="choice-title">포장하기</span>' +
                  '<span class="choice-sub">일회용 컵·캐리어에 담아 가져가요</span>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }

      if (s === 1) {
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-cafe">' +
              '<div class="kiosk-machine-brand">행복 카페 키오스크 · ' + diningLabel + '</div>' +
              '<span class="kiosk-machine-tag">담긴 음료 ' + cafeState.cart.reduce(function (a, b) { return a + b.qty; }, 0) + '잔</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<h2 class="step-heading">원하시는 음료를 선택해 주세요</h2>' +
              '<p class="step-sub">아래 8가지 메뉴 중 드시고 싶은 음료를 눌러 주세요.</p>' +
              '<div class="choice-grid-menu">' +
                CAFE_DRINKS.map(function (drink) {
                  const sel = cafeState.selectedDrinkId === drink.id ? 'selected' : '';
                  return (
                    '<button type="button" class="choice-card ' + sel + '" data-cafe-drink="' + drink.id + '">' +
                      renderDrinkSvg(drink) +
                      '<span class="choice-title">' + escapeHtml(drink.name) + '</span>' +
                      '<span class="choice-sub">' + escapeHtml(drink.desc) + '</span>' +
                      '<span class="choice-price">' + formatWon(drink.price) + '</span>' +
                    '</button>'
                  );
                }).join('') +
              '</div>' +
              (cafeState.cart.length > 0
                ? '<div style="margin-top:18px; text-align:right;">' +
                    '<button type="button" class="btn btn-secondary" id="cafeJumpCartBtn">이미 담은 장바구니 바로 보기 (' + cafeState.cart.length + '종)</button>' +
                  '</div>'
                : '') +
            '</div>' +
          '</div>'
        );
      }

      if (s === 2) {
        const drink = getCafeDrink(cafeState.selectedDrinkId);
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-cafe">' +
              '<div class="kiosk-machine-brand">선택한 음료 · ' + escapeHtml(drink ? drink.name : '') + '</div>' +
              '<span class="kiosk-machine-tag">3단계 · 옵션 선택</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<div style="display:flex; align-items:center; gap:16px; padding:14px 18px; background:var(--soft-bg); border:2px solid var(--border); border-radius:16px; margin-bottom:22px; flex-wrap:wrap;">' +
                (drink ? renderDrinkSvg(drink) : '') +
                '<div>' +
                  '<div style="font-size:1.3rem; font-weight:900;">' + escapeHtml(drink ? drink.name : '') + '</div>' +
                  '<div style="color:var(--royal-blue); font-weight:800;">기본 가격 ' + formatWon(drink ? drink.price : 0) + '</div>' +
                '</div>' +
              '</div>' +

              '<h2 class="step-heading">1) 따뜻하게 드실까요, 차갑게 드실까요?</h2>' +
              '<div class="choice-grid-2" style="margin-bottom:24px;">' +
                '<button type="button" class="choice-card ' + (cafeState.temp === 'hot' ? 'selected' : '') + '" data-cafe-temp="hot">' +
                  '<svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">' +
                    '<circle cx="28" cy="28" r="24" fill="#FFF0E6" stroke="#C53030" stroke-width="2.5"/>' +
                    '<path d="M21 34C21 28 28 24 28 16C33 21 37 26 37 33C37 38.5 33 42 28 42C23.5 42 21 38.5 21 34Z" fill="#E0523C"/>' +
                  '</svg>' +
                  '<span class="choice-title">따뜻한 음료</span>' +
                  '<span class="choice-sub">김이 모락모락 따뜻한 잔</span>' +
                '</button>' +
                '<button type="button" class="choice-card ' + (cafeState.temp === 'ice' ? 'selected' : '') + '" data-cafe-temp="ice">' +
                  '<svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">' +
                    '<circle cx="28" cy="28" r="24" fill="#DCEBFC" stroke="#2458A6" stroke-width="2.5"/>' +
                    '<rect x="19" y="19" width="18" height="18" rx="4" fill="#91BDF2" stroke="#2458A6" stroke-width="2.5"/>' +
                    '<path d="M24 24L32 32M32 24L24 32" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>' +
                  '</svg>' +
                  '<span class="choice-title">차가운 음료</span>' +
                  '<span class="choice-sub">얼음이 들어간 시원한 잔</span>' +
                '</button>' +
              '</div>' +

              '<h2 class="step-heading">2) 음료 크기를 선택해 주세요</h2>' +
              '<div class="choice-grid-2">' +
                '<button type="button" class="choice-card ' + (cafeState.size === 'regular' ? 'selected' : '') + '" data-cafe-size="regular">' +
                  '<svg width="52" height="56" viewBox="0 0 52 56" fill="none" aria-hidden="true">' +
                    '<path d="M14 22H38L35 48H17L14 22Z" fill="#DCEBFC" stroke="#2458A6" stroke-width="2.8"/>' +
                    '<rect x="12" y="18" width="28" height="5" rx="2.5" fill="#2458A6"/>' +
                  '</svg>' +
                  '<span class="choice-title">보통 크기 (M)</span>' +
                  '<span class="choice-price">추가 요금 없음</span>' +
                '</button>' +
                '<button type="button" class="choice-card ' + (cafeState.size === 'large' ? 'selected' : '') + '" data-cafe-size="large">' +
                  '<svg width="58" height="62" viewBox="0 0 58 62" fill="none" aria-hidden="true">' +
                    '<path d="M12 16H46L42 54H16L12 16Z" fill="#91BDF2" stroke="#2458A6" stroke-width="2.8"/>' +
                    '<rect x="9" y="11" width="40" height="6" rx="3" fill="#2458A6"/>' +
                  '</svg>' +
                  '<span class="choice-title">큰 크기 (L)</span>' +
                  '<span class="choice-price">+ 500원</span>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }

      if (s === 3) {
        const drink = getCafeDrink(cafeState.selectedDrinkId);
        const unitPrice = getCafeItemUnitPrice(drink, cafeState.size);
        const subTotal = unitPrice * cafeState.qty;
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-cafe">' +
              '<div class="kiosk-machine-brand">행복 카페 키오스크 · 수량 선택</div>' +
              '<span class="kiosk-machine-tag">4단계 · 수량 정하기</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<h2 class="step-heading">몇 잔 주문하실까요?</h2>' +
              '<p class="step-sub">선택하신 음료와 옵션을 확인하고 수량을 맞춰 주세요.</p>' +
              '<div class="summary-box" style="margin-bottom:20px;">' +
                '<div class="summary-row"><span class="summary-label">선택 음료</span><span class="summary-val">' + escapeHtml(drink ? drink.name : '') + '</span></div>' +
                '<div class="summary-row"><span class="summary-label">온도</span><span class="summary-val">' + (cafeState.temp === 'hot' ? '따뜻한 음료' : '차가운 음료') + '</span></div>' +
                '<div class="summary-row"><span class="summary-label">크기</span><span class="summary-val">' + (cafeState.size === 'large' ? '큰 크기 (L, +500원)' : '보통 크기 (M)') + '</span></div>' +
                '<div class="summary-row"><span class="summary-label">1잔 가격</span><span class="summary-val">' + formatWon(unitPrice) + '</span></div>' +
              '</div>' +

              '<div class="qty-box">' +
                '<button type="button" class="qty-btn" id="cafeQtyMinus" aria-label="수량 1 줄이기" ' + (cafeState.qty <= 1 ? 'disabled' : '') + '>−</button>' +
                '<span class="qty-value">' + cafeState.qty + '잔</span>' +
                '<button type="button" class="qty-btn" id="cafeQtyPlus" aria-label="수량 1 늘리기" ' + (cafeState.qty >= 9 ? 'disabled' : '') + '>+</button>' +
              '</div>' +

              '<div class="total-price-bar">' +
                '<span class="total-price-label">이 음료 합계 금액</span>' +
                '<span class="total-price-amount">' + formatWon(subTotal) + '</span>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }

      if (s === 4) {
        const total = getCafeCartTotal();
        const totalQty = cafeState.cart.reduce(function (a, b) { return a + b.qty; }, 0);
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-cafe">' +
              '<div class="kiosk-machine-brand">행복 카페 키오스크 · 장바구니</div>' +
              '<span class="kiosk-machine-tag">총 ' + totalQty + '잔</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:16px;">' +
                '<div>' +
                  '<h2 class="step-heading" style="margin-bottom:4px;">장바구니를 확인해 주세요</h2>' +
                  '<p class="step-sub" style="margin-bottom:0;">이용 방식: <strong>' + diningLabel + '</strong></p>' +
                '</div>' +
                '<div style="display:flex; gap:10px; flex-wrap:wrap;">' +
                  '<button type="button" class="btn btn-secondary" id="cafeChangeDiningBtn">매장·포장 변경</button>' +
                  '<button type="button" class="btn btn-outline" id="cafeAddMoreBtn">+ 음료 더 추가하기</button>' +
                '</div>' +
              '</div>' +

              (cafeState.cart.length === 0
                ? '<div class="summary-box" style="text-align:center; padding:34px 20px;">' +
                    '<p style="font-weight:800; margin:0 0 16px;">장바구니에 담긴 음료가 없습니다.</p>' +
                    '<button type="button" class="btn btn-primary" id="cafeEmptyAddBtn">음료 고르러 가기</button>' +
                  '</div>'
                : cafeState.cart.map(function (item, idx) {
                    return (
                      '<div class="cart-item-card">' +
                        '<div class="cart-item-top">' +
                          '<div>' +
                            '<div style="font-size:1.18rem; font-weight:900;">' + escapeHtml(item.name) + '</div>' +
                            '<div style="color:var(--text-sub); font-size:0.92rem;">' +
                              (item.temp === 'hot' ? '따뜻한 음료' : '차가운 음료') + ' · ' +
                              (item.size === 'large' ? '큰 크기(L)' : '보통 크기(M)') +
                            '</div>' +
                          '</div>' +
                          '<div style="font-size:1.25rem; font-weight:900; color:var(--royal-blue);">' +
                            formatWon(item.unitPrice * item.qty) +
                          '</div>' +
                        '</div>' +
                        '<div class="cart-item-controls">' +
                          '<div style="display:flex; align-items:center; gap:10px;">' +
                            '<button type="button" class="qty-btn small" data-cafe-cart-minus="' + idx + '" aria-label="수량 줄이기">−</button>' +
                            '<span style="font-size:1.2rem; font-weight:900; min-width:44px; text-align:center;">' + item.qty + '잔</span>' +
                            '<button type="button" class="qty-btn small" data-cafe-cart-plus="' + idx + '" aria-label="수량 늘리기">+</button>' +
                          '</div>' +
                          '<div style="display:flex; gap:8px; flex-wrap:wrap;">' +
                            '<button type="button" class="btn btn-secondary" style="min-height:48px; padding:8px 14px;" data-cafe-cart-edit="' + idx + '">옵션 수정</button>' +
                            '<button type="button" class="btn btn-danger-outline" style="min-height:48px; padding:8px 14px;" data-cafe-cart-del="' + idx + '">삭제</button>' +
                          '</div>' +
                        '</div>' +
                      '</div>'
                    );
                  }).join('')
              ) +

              '<div class="total-price-bar">' +
                '<span class="total-price-label">총 주문 금액 (' + totalQty + '잔)</span>' +
                '<span class="total-price-amount">' + formatWon(total) + '</span>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }

      if (s === 5) {
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-cafe">' +
              '<div class="kiosk-machine-brand">행복 카페 키오스크 · 결제 방법</div>' +
              '<span class="kiosk-machine-tag">6단계 · 결제 수단 선택</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<h2 class="step-heading">결제 방법을 선택해 주세요</h2>' +
              '<p class="step-sub">연습용 결제이므로 실제 요금은 청구되지 않습니다.</p>' +
              '<div class="total-price-bar" style="margin-top:0; margin-bottom:20px;">' +
                '<span class="total-price-label">결제할 연습용 금액</span>' +
                '<span class="total-price-amount">' + formatWon(getCafeCartTotal()) + '</span>' +
              '</div>' +
              '<div class="choice-grid-2">' +
                '<button type="button" class="choice-card ' + (cafeState.paymentMethod === 'card' ? 'selected' : '') + '" data-cafe-pay="card" style="min-height:190px;">' +
                  '<svg width="74" height="54" viewBox="0 0 74 54" fill="none" aria-hidden="true">' +
                    '<rect x="3" y="4" width="68" height="46" rx="8" fill="#2458A6"/>' +
                    '<rect x="3" y="14" width="68" height="8" fill="#172B4D"/>' +
                    '<rect x="12" y="29" width="16" height="11" rx="2.5" fill="#F5CF69"/>' +
                  '</svg>' +
                  '<span class="choice-title">신용·체크카드 결제</span>' +
                  '<span class="choice-sub">가상의 카드 투입구에 카드를 꽂아 연습해요 (추천)</span>' +
                '</button>' +
                '<button type="button" class="choice-card ' + (cafeState.paymentMethod === 'mobile' ? 'selected' : '') + '" data-cafe-pay="mobile" style="min-height:190px;">' +
                  '<svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">' +
                    '<rect x="18" y="6" width="28" height="52" rx="6" fill="#DCEBFC" stroke="#2458A6" stroke-width="3"/>' +
                    '<rect x="24" y="18" width="16" height="22" rx="2" fill="#2458A6"/>' +
                    '<circle cx="32" cy="49" r="2.5" fill="#2458A6"/>' +
                  '</svg>' +
                  '<span class="choice-title">모바일 간편결제</span>' +
                  '<span class="choice-sub">휴대폰 바코드를 대어 보는 연습이에요</span>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }

      if (s === 6) {
        return renderCardPaymentStep({
          themeClass: 'theme-cafe',
          brandName: '행복 카페 키오스크',
          totalAmount: getCafeCartTotal(),
          paymentMethod: cafeState.paymentMethod,
          cardInserted: cafeState.cardInserted,
          completeButtonLabel: '주문 완료하고 주문번호 확인하기 →'
        });
      }

      // Step 7: Completion Screen
      const total = getCafeCartTotal();
      return (
        '<div class="result-hero">' +
          '<div class="result-check-circle" aria-hidden="true">' +
            '<svg width="40" height="40" viewBox="0 0 24 24" fill="none">' +
              '<path d="M5 13L9.5 17.5L19 7" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>' +
          '</div>' +
          '<h2 class="result-title">카페 주문 연습이 완료되었습니다!</h2>' +
          '<p class="result-subtitle">실제 주문과 결제는 이루어지지 않았습니다. 정말 잘 해내셨어요!</p>' +
        '</div>' +

        '<div class="result-big-number-box">' +
          '<div class="result-big-label">연습용 주문번호</div>' +
          '<div class="result-big-value">' + escapeHtml(cafeState.orderNumber) + '</div>' +
        '</div>' +

        '<div class="card">' +
          '<h3 style="margin:0 0 14px; font-size:1.25rem; color:var(--royal-blue);">주문 내역 확인</h3>' +
          '<div class="summary-box">' +
            '<div class="summary-row"><span class="summary-label">이용 방법</span><span class="summary-val">' + diningLabel + '</span></div>' +
            '<div class="summary-row"><span class="summary-label">결제 방법</span><span class="summary-val">' + (cafeState.paymentMethod === 'card' ? '신용·체크카드 (연습용)' : '모바일 간편결제 (연습용)') + '</span></div>' +
            cafeState.cart.map(function (item) {
              return (
                '<div class="summary-row">' +
                  '<span class="summary-label">' +
                    '<strong>' + escapeHtml(item.name) + '</strong> (' +
                    (item.temp === 'hot' ? '따뜻함' : '차가움') + ', ' +
                    (item.size === 'large' ? '큰 크기 L' : '보통 크기 M') + ') × ' + item.qty + '잔' +
                  '</span>' +
                  '<span class="summary-val">' + formatWon(item.unitPrice * item.qty) + '</span>' +
                '</div>'
              );
            }).join('') +
          '</div>' +
          '<div class="total-price-bar">' +
            '<span class="total-price-label">총 연습 결제 금액</span>' +
            '<span class="total-price-amount">' + formatWon(total) + '</span>' +
          '</div>' +
        '</div>' +
        renderResultFooterButtons('cafe')
      );
    },
    bindEvents: function (container) {
      container.querySelectorAll('[data-cafe-dining]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          cafeState.dining = btn.dataset.cafeDining;
          renderActiveKiosk();
        });
      });
      container.querySelectorAll('[data-cafe-drink]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          cafeState.selectedDrinkId = btn.dataset.cafeDrink;
          renderActiveKiosk();
        });
      });
      const jumpCart = container.querySelector('#cafeJumpCartBtn');
      if (jumpCart) {
        jumpCart.addEventListener('click', function () {
          cafeState.step = 4;
          renderActiveKiosk();
        });
      }
      container.querySelectorAll('[data-cafe-temp]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          cafeState.temp = btn.dataset.cafeTemp;
          renderActiveKiosk();
        });
      });
      container.querySelectorAll('[data-cafe-size]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          cafeState.size = btn.dataset.cafeSize;
          renderActiveKiosk();
        });
      });
      const qtyMinus = container.querySelector('#cafeQtyMinus');
      const qtyPlus = container.querySelector('#cafeQtyPlus');
      if (qtyMinus) {
        qtyMinus.addEventListener('click', function () {
          if (cafeState.qty > 1) {
            cafeState.qty -= 1;
            renderActiveKiosk();
          }
        });
      }
      if (qtyPlus) {
        qtyPlus.addEventListener('click', function () {
          if (cafeState.qty < 9) {
            cafeState.qty += 1;
            renderActiveKiosk();
          }
        });
      }
      const addMore = container.querySelector('#cafeAddMoreBtn');
      const emptyAdd = container.querySelector('#cafeEmptyAddBtn');
      if (addMore) {
        addMore.addEventListener('click', function () {
          resetCafeDraft();
          cafeState.step = 1;
          renderActiveKiosk();
        });
      }
      if (emptyAdd) {
        emptyAdd.addEventListener('click', function () {
          resetCafeDraft();
          cafeState.step = 1;
          renderActiveKiosk();
        });
      }
      const changeDining = container.querySelector('#cafeChangeDiningBtn');
      if (changeDining) {
        changeDining.addEventListener('click', function () {
          cafeState.dining = cafeState.dining === 'dine_in' ? 'take_out' : 'dine_in';
          renderActiveKiosk();
        });
      }
      container.querySelectorAll('[data-cafe-cart-minus]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const i = Number(btn.dataset.cafeCartMinus);
          if (cafeState.cart[i] && cafeState.cart[i].qty > 1) {
            cafeState.cart[i].qty -= 1;
            renderActiveKiosk();
          }
        });
      });
      container.querySelectorAll('[data-cafe-cart-plus]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const i = Number(btn.dataset.cafeCartPlus);
          if (cafeState.cart[i] && cafeState.cart[i].qty < 9) {
            cafeState.cart[i].qty += 1;
            renderActiveKiosk();
          }
        });
      });
      container.querySelectorAll('[data-cafe-cart-edit]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const i = Number(btn.dataset.cafeCartEdit);
          const target = cafeState.cart[i];
          if (target) {
            cafeState.selectedDrinkId = target.drinkId;
            cafeState.temp = target.temp;
            cafeState.size = target.size;
            cafeState.qty = target.qty;
            cafeState.editingIndex = i;
            cafeState.step = 2;
            renderActiveKiosk();
          }
        });
      });
      container.querySelectorAll('[data-cafe-cart-del]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const i = Number(btn.dataset.cafeCartDel);
          cafeState.cart.splice(i, 1);
          renderActiveKiosk();
        });
      });
      container.querySelectorAll('[data-cafe-pay]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          cafeState.paymentMethod = btn.dataset.cafePay;
          renderActiveKiosk();
        });
      });
      const insertBtn = container.querySelector('#virtualCardInsertBtn');
      if (insertBtn) {
        insertBtn.addEventListener('click', function () {
          cafeState.cardInserted = true;
          renderActiveKiosk();
        });
      }
      const completeBtn = container.querySelector('#virtualCardCompleteBtn');
      if (completeBtn) {
        completeBtn.addEventListener('click', function () {
          cafeState.orderNumber = randomOrderCode('C');
          cafeState.step = 7;
          renderActiveKiosk();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
      bindResultFooterButtons(container);
    }
  };

  /* ================= 2. RESTAURANT KIOSK MODULE ================= */
  const RESTAURANT_MENUS = [
    { id: 'bulgogi', category: 'burger', name: '불고기버거', singlePrice: 4800, setPrice: 6800, setDesc: '버거 + 감자튀김 + 콜라', desc: '달콤짭짤한 불고기 소스 버거', color: '#8B4513' },
    { id: 'cheese', category: 'burger', name: '치즈버거', singlePrice: 4500, setPrice: 6500, setDesc: '버거 + 감자튀김 + 콜라', desc: '고소한 치즈가 듬뿍 든 버거', color: '#F2B938' },
    { id: 'chicken', category: 'burger', name: '치킨버거', singlePrice: 5200, setPrice: 7200, setDesc: '버거 + 감자튀김 + 콜라', desc: '바삭한 치킨 패티 버거', color: '#D48C3B' },
    { id: 'shrimp', category: 'burger', name: '새우버거', singlePrice: 5500, setPrice: 7500, setDesc: '버거 + 감자튀김 + 콜라', desc: '탱글한 새우 패티 버거', color: '#E87A5D' },
    { id: 'fries', category: 'side', name: '감자튀김', singlePrice: 2200, setPrice: 3700, setDesc: '감자튀김 + 탄산음료', desc: '바삭하게 튀긴 황금 감자', color: '#F5CF69' },
    { id: 'nugget', category: 'side', name: '치킨너겟', singlePrice: 3000, setPrice: 4500, setDesc: '치킨너겟 6조각 + 탄산음료', desc: '한입에 먹기 좋은 치킨너겟', color: '#C87D32' },
    { id: 'cheesestick', category: 'side', name: '치즈스틱', singlePrice: 2500, setPrice: 4000, setDesc: '치즈스틱 2개 + 탄산음료', desc: '쭉 늘어나는 고소한 치즈스틱', color: '#E6A832' },
    { id: 'cola', category: 'drink', name: '콜라', singlePrice: 1800, setPrice: 3600, setDesc: '콜라 + 감자튀김(소)', desc: '시원하고 톡 쏘는 콜라', color: '#4A2C2A' },
    { id: 'cider', category: 'drink', name: '사이다', singlePrice: 1800, setPrice: 3600, setDesc: '사이다 + 감자튀김(소)', desc: '깔끔하고 청량한 사이다', color: '#3B9B6F' }
  ];

  const RESTAURANT_ADDONS = [
    { id: 'fries', name: '감자튀김', price: 2200 },
    { id: 'nugget', name: '치킨너겟', price: 3000 },
    { id: 'cheesestick', name: '치즈스틱', price: 2500 },
    { id: 'cola', name: '콜라', price: 1800 },
    { id: 'cider', name: '사이다', price: 1800 }
  ];

  function renderFoodSvg(item) {
    if (item.category === 'burger') {
      return (
        '<svg width="74" height="70" viewBox="0 0 74 70" fill="none" aria-hidden="true">' +
          '<path d="M12 31C12 18 22 12 37 12C52 12 62 18 62 31H12Z" fill="#F5CF69" stroke="#172B4D" stroke-width="2.5"/>' +
          '<circle cx="28" cy="21" r="2" fill="#FFFFFF"/><circle cx="38" cy="18" r="2" fill="#FFFFFF"/><circle cx="47" cy="22" r="2" fill="#FFFFFF"/>' +
          '<rect x="10" y="32" width="54" height="6" rx="3" fill="#287A4B"/>' +
          '<rect x="12" y="39" width="50" height="8" rx="4" fill="' + item.color + '"/>' +
          '<path d="M14 48H60V52C60 55.3 57.3 58 54 58H20C16.7 58 14 55.3 14 52V48Z" fill="#F5CF69" stroke="#172B4D" stroke-width="2.5"/>' +
        '</svg>'
      );
    }
    if (item.id === 'fries') {
      return (
        '<svg width="74" height="70" viewBox="0 0 74 70" fill="none" aria-hidden="true">' +
          '<rect x="21" y="12" width="6" height="24" rx="3" fill="#F5CF69" stroke="#172B4D" stroke-width="2"/>' +
          '<rect x="30" y="8" width="6" height="28" rx="3" fill="#F5CF69" stroke="#172B4D" stroke-width="2"/>' +
          '<rect x="39" y="10" width="6" height="26" rx="3" fill="#F5CF69" stroke="#172B4D" stroke-width="2"/>' +
          '<rect x="48" y="14" width="6" height="22" rx="3" fill="#F5CF69" stroke="#172B4D" stroke-width="2"/>' +
          '<path d="M16 28H58L52 60H22L16 28Z" fill="#D94B4B" stroke="#172B4D" stroke-width="2.5" stroke-linejoin="round"/>' +
          '<circle cx="37" cy="45" r="7" fill="#F5CF69"/>' +
        '</svg>'
      );
    }
    if (item.id === 'nugget') {
      return (
        '<svg width="74" height="70" viewBox="0 0 74 70" fill="none" aria-hidden="true">' +
          '<ellipse cx="27" cy="34" rx="13" ry="10" fill="#D48C3B" stroke="#172B4D" stroke-width="2.5"/>' +
          '<ellipse cx="47" cy="30" rx="13" ry="10" fill="#C87D32" stroke="#172B4D" stroke-width="2.5"/>' +
          '<ellipse cx="38" cy="48" rx="15" ry="10" fill="#E09B45" stroke="#172B4D" stroke-width="2.5"/>' +
        '</svg>'
      );
    }
    if (item.id === 'cheesestick') {
      return (
        '<svg width="74" height="70" viewBox="0 0 74 70" fill="none" aria-hidden="true">' +
          '<rect x="14" y="20" width="46" height="12" rx="6" transform="rotate(-12 14 20)" fill="#E6A832" stroke="#172B4D" stroke-width="2.5"/>' +
          '<rect x="16" y="40" width="46" height="12" rx="6" transform="rotate(-12 16 40)" fill="#F5CF69" stroke="#172B4D" stroke-width="2.5"/>' +
        '</svg>'
      );
    }
    // Drink (cola / cider)
    return (
      '<svg width="74" height="70" viewBox="0 0 74 70" fill="none" aria-hidden="true">' +
        '<path d="M39 7L44 20" stroke="#2458A6" stroke-width="3.5" stroke-linecap="round"/>' +
        '<path d="M21 20H53L48 60H26L21 20Z" fill="' + item.color + '" stroke="#172B4D" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<rect x="18" y="16" width="38" height="6" rx="3" fill="#DCEBFC" stroke="#172B4D" stroke-width="2"/>' +
        '<circle cx="33" cy="36" r="3" fill="#FFFFFF" opacity="0.7"/>' +
        '<circle cx="42" cy="44" r="2.5" fill="#FFFFFF" opacity="0.7"/>' +
        '<circle cx="35" cy="50" r="2" fill="#FFFFFF" opacity="0.7"/>' +
      '</svg>'
    );
  }

  const REST_STEPS = [
    '매장·포장',
    '음식 선택',
    '단품·세트',
    '추가 메뉴·수량',
    '장바구니 확인',
    '결제 방법',
    '모의 결제',
    '주문 완료'
  ];

  const restState = {
    step: 0,
    dining: null,
    category: 'all',
    selectedMenuId: null,
    mealType: null, // 'single' | 'set'
    selectedAddonIds: [],
    qty: 1,
    editingIndex: null,
    cart: [],
    paymentMethod: null,
    cardInserted: false,
    orderNumber: ''
  };

  function getRestMenu(id) {
    return RESTAURANT_MENUS.find(function (m) { return m.id === id; }) || null;
  }

  function getRestAddon(id) {
    return RESTAURANT_ADDONS.find(function (a) { return a.id === id; }) || null;
  }

  function getRestDraftUnitPrice() {
    const menu = getRestMenu(restState.selectedMenuId);
    if (!menu) return 0;
    const base = restState.mealType === 'set' ? menu.setPrice : menu.singlePrice;
    const addonSum = restState.selectedAddonIds.reduce(function (acc, id) {
      const a = getRestAddon(id);
      return acc + (a ? a.price : 0);
    }, 0);
    return base + addonSum;
  }

  function getRestCartTotal() {
    return restState.cart.reduce(function (sum, item) {
      return sum + item.unitPrice * item.qty;
    }, 0);
  }

  function resetRestDraft() {
    restState.selectedMenuId = null;
    restState.mealType = null;
    restState.selectedAddonIds = [];
    restState.qty = 1;
    restState.editingIndex = null;
  }

  KIOSK_MODULES.restaurant = {
    reset: function () {
      restState.step = 0;
      restState.dining = null;
      restState.category = 'all';
      resetRestDraft();
      restState.cart = [];
      restState.paymentMethod = null;
      restState.cardInserted = false;
      restState.orderNumber = '';
    },
    getMeta: function () {
      const guides = [
        '먼저 매장에서 식사하실지, 포장해서 가져가실지 선택해 주세요.',
        '드시고 싶은 음식을 골라 눌러 주세요. 위쪽 분류 버튼(버거·사이드·음료)으로 찾아보실 수도 있어요.',
        '고르신 음식을 단품으로 드실지, 세트로 드실지 선택해 주세요. 가격 차이를 확인해 보세요.',
        '함께 드실 추가 메뉴가 있다면 골라 보시고, 주문 수량도 맞춰 주세요. 추가 메뉴는 안 고르셔도 괜찮아요.',
        '장바구니에 담긴 음식과 총금액을 확인해 주세요. 음식을 더 추가하거나 수량을 바꿀 수 있어요.',
        '결제 방법을 선택해 주세요. 연습에서는 신용·체크카드 결제를 눌러 보시는 것을 추천해요.',
        '가상의 카드 투입 버튼을 눌러 모의 결제를 체험해 보세요. 실제 돈은 결제되지 않습니다.',
        '아주 잘 하셨어요! 음식점 키오스크 주문 연습을 성공적으로 마치셨습니다.'
      ];
      const nextLabels = [
        '다음 단계 (음식 선택) →',
        '다음 단계 (단품·세트 선택) →',
        '다음 단계 (추가 메뉴·수량) →',
        '장바구니에 담고 확인하기 →',
        '결제 방법 선택하기 →',
        '모의 결제 화면으로 →',
        '결제 완료하기 →',
        ''
      ];
      return {
        title: '음식점 키오스크 주문 연습',
        steps: REST_STEPS,
        stepIndex: restState.step,
        teacherMessage: guides[restState.step],
        nextLabel: nextLabels[restState.step],
        isResult: restState.step === 7,
        hideNextButton: restState.step === 6 && !restState.cardInserted
      };
    },
    prev: function () {
      if (restState.step === 0) return;
      if (restState.step === 6) restState.cardInserted = false;
      restState.step -= 1;
    },
    next: function () {
      if (restState.step === 0) {
        if (!restState.dining) return '매장에서 식사하실지, 포장하실지 먼저 선택해 주세요.';
        restState.step = 1;
        return null;
      }
      if (restState.step === 1) {
        if (!restState.selectedMenuId) return '주문하실 음식 메뉴를 하나 선택해 주세요.';
        restState.step = 2;
        return null;
      }
      if (restState.step === 2) {
        if (!restState.mealType) return '단품으로 드실지, 세트로 드실지 먼저 선택해 주세요.';
        restState.step = 3;
        return null;
      }
      if (restState.step === 3) {
        const menu = getRestMenu(restState.selectedMenuId);
        if (!menu) {
          restState.step = 1;
          return '음식을 다시 선택해 주세요.';
        }
        const addons = restState.selectedAddonIds.map(function (id) {
          return getRestAddon(id);
        }).filter(Boolean);
        const newItem = {
          menuId: menu.id,
          name: menu.name,
          mealType: restState.mealType,
          setDesc: menu.setDesc,
          addons: addons,
          qty: restState.qty,
          unitPrice: getRestDraftUnitPrice()
        };
        if (restState.editingIndex !== null && restState.cart[restState.editingIndex]) {
          restState.cart[restState.editingIndex] = newItem;
        } else {
          restState.cart.push(newItem);
        }
        resetRestDraft();
        restState.step = 4;
        return null;
      }
      if (restState.step === 4) {
        if (restState.cart.length === 0) {
          return '장바구니가 비어 있어요. "음식 더 추가하기" 버튼을 눌러 메뉴를 담아 주세요.';
        }
        restState.step = 5;
        return null;
      }
      if (restState.step === 5) {
        if (!restState.paymentMethod) return '결제 방법(신용·체크카드 등)을 선택해 주세요.';
        restState.cardInserted = false;
        restState.step = 6;
        return null;
      }
      if (restState.step === 6) {
        if (!restState.cardInserted) return '먼저 "연습용 카드 투입하기" 버튼을 눌러 주세요.';
        restState.orderNumber = randomOrderCode('F');
        restState.step = 7;
        return null;
      }
      return null;
    },
    render: function () {
      const s = restState.step;
      const diningLabel = restState.dining === 'dine_in' ? '매장에서 먹기' : (restState.dining === 'take_out' ? '포장하기' : '');

      if (s === 0) {
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-restaurant">' +
              '<div class="kiosk-machine-brand">든든 버거 음식점 키오스크</div>' +
              '<span class="kiosk-machine-tag">1단계 · 식사 장소 선택</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<h2 class="step-heading">식사하실 장소를 선택해 주세요</h2>' +
              '<p class="step-sub">매장에서 드실지, 포장해서 가져가실지 큰 버튼을 눌러 주세요.</p>' +
              '<div class="choice-grid-2">' +
                '<button type="button" class="choice-card ' + (restState.dining === 'dine_in' ? 'selected' : '') + '" data-rest-dining="dine_in" style="min-height:210px;">' +
                  '<svg width="74" height="74" viewBox="0 0 72 72" fill="none" aria-hidden="true">' +
                    '<rect x="10" y="42" width="52" height="10" rx="5" fill="#2458A6"/>' +
                    '<path d="M18 32C18 22 26 16 36 16C46 16 54 22 54 32H18Z" fill="#F5CF69" stroke="#172B4D" stroke-width="2.5"/>' +
                    '<rect x="18" y="33" width="36" height="8" rx="3" fill="#287A4B"/>' +
                  '</svg>' +
                  '<span class="choice-title">매장에서 먹기</span>' +
                  '<span class="choice-sub">쟁반에 받아 매장 안에서 식사해요</span>' +
                '</button>' +
                '<button type="button" class="choice-card ' + (restState.dining === 'take_out' ? 'selected' : '') + '" data-rest-dining="take_out" style="min-height:210px;">' +
                  '<svg width="74" height="74" viewBox="0 0 72 72" fill="none" aria-hidden="true">' +
                    '<path d="M18 22H54L50 60H22L18 22Z" fill="#F5CF69" stroke="#172B4D" stroke-width="2.8" stroke-linejoin="round"/>' +
                    '<path d="M27 22V17C27 12.6 31 9 36 9C41 9 45 12.6 45 17V22" stroke="#2458A6" stroke-width="3" stroke-linecap="round"/>' +
                    '<rect x="27" y="34" width="18" height="14" rx="3" fill="#FFFFFF"/>' +
                  '</svg>' +
                  '<span class="choice-title">포장하기</span>' +
                  '<span class="choice-sub">종이봉투에 포장해서 가져가요</span>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }

      if (s === 1) {
        const filtered = RESTAURANT_MENUS.filter(function (m) {
          return restState.category === 'all' || m.category === restState.category;
        });
        const cats = [
          { id: 'all', label: '전체 메뉴 (9)' },
          { id: 'burger', label: '버거 (4)' },
          { id: 'side', label: '사이드 (3)' },
          { id: 'drink', label: '음료 (2)' }
        ];
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-restaurant">' +
              '<div class="kiosk-machine-brand">든든 버거 키오스크 · ' + diningLabel + '</div>' +
              '<span class="kiosk-machine-tag">담긴 메뉴 ' + restState.cart.reduce(function (a, b) { return a + b.qty; }, 0) + '개</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<h2 class="step-heading">드시고 싶은 음식을 선택해 주세요</h2>' +
              '<div class="filter-tabs" role="tablist" aria-label="음식 분류 선택">' +
                cats.map(function (c) {
                  return '<button type="button" class="filter-tab ' + (restState.category === c.id ? 'active' : '') + '" data-rest-cat="' + c.id + '">' + c.label + '</button>';
                }).join('') +
              '</div>' +
              '<div class="choice-grid-menu">' +
                filtered.map(function (item) {
                  const sel = restState.selectedMenuId === item.id ? 'selected' : '';
                  return (
                    '<button type="button" class="choice-card ' + sel + '" data-rest-menu="' + item.id + '">' +
                      renderFoodSvg(item) +
                      '<span class="choice-title">' + escapeHtml(item.name) + '</span>' +
                      '<span class="choice-sub">' + escapeHtml(item.desc) + '</span>' +
                      '<span class="choice-price">단품 ' + formatWon(item.singlePrice) + '</span>' +
                      '<span class="choice-sub" style="font-weight:800; color:var(--royal-blue-dark);">세트 ' + formatWon(item.setPrice) + '</span>' +
                    '</button>'
                  );
                }).join('') +
              '</div>' +
              (restState.cart.length > 0
                ? '<div style="margin-top:18px; text-align:right;">' +
                    '<button type="button" class="btn btn-secondary" id="restJumpCartBtn">이미 담은 장바구니 바로 보기 (' + restState.cart.length + '종)</button>' +
                  '</div>'
                : '') +
            '</div>' +
          '</div>'
        );
      }

      if (s === 2) {
        const menu = getRestMenu(restState.selectedMenuId);
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-restaurant">' +
              '<div class="kiosk-machine-brand">선택 음식 · ' + escapeHtml(menu ? menu.name : '') + '</div>' +
              '<span class="kiosk-machine-tag">3단계 · 단품 / 세트 선택</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<div style="display:flex; align-items:center; gap:16px; padding:14px 18px; background:var(--soft-bg); border:2px solid var(--border); border-radius:16px; margin-bottom:22px; flex-wrap:wrap;">' +
                (menu ? renderFoodSvg(menu) : '') +
                '<div>' +
                  '<div style="font-size:1.3rem; font-weight:900;">' + escapeHtml(menu ? menu.name : '') + '</div>' +
                  '<div style="color:var(--text-sub);">' + escapeHtml(menu ? menu.desc : '') + '</div>' +
                '</div>' +
              '</div>' +

              '<h2 class="step-heading">단품으로 드실까요, 세트로 드실까요?</h2>' +
              '<p class="step-sub">단품과 세트의 구성과 가격이 다릅니다. 원하시는 쪽을 눌러 주세요.</p>' +
              '<div class="choice-grid-2">' +
                '<button type="button" class="choice-card ' + (restState.mealType === 'single' ? 'selected' : '') + '" data-rest-meal="single" style="min-height:210px;">' +
                  '<span class="choice-title">단품 선택</span>' +
                  '<span class="choice-sub">' + escapeHtml(menu ? menu.name : '') + ' 만 주문해요</span>' +
                  '<span class="choice-price" style="font-size:1.45rem;">' + formatWon(menu ? menu.singlePrice : 0) + '</span>' +
                '</button>' +
                '<button type="button" class="choice-card ' + (restState.mealType === 'set' ? 'selected' : '') + '" data-rest-meal="set" style="min-height:210px;">' +
                  '<span class="choice-title">세트 선택</span>' +
                  '<span class="choice-sub">' + escapeHtml(menu ? menu.setDesc : '') + '</span>' +
                  '<span class="choice-price" style="font-size:1.45rem;">' + formatWon(menu ? menu.setPrice : 0) + '</span>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }

      if (s === 3) {
        const menu = getRestMenu(restState.selectedMenuId);
        const unitPrice = getRestDraftUnitPrice();
        const subTotal = unitPrice * restState.qty;
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-restaurant">' +
              '<div class="kiosk-machine-brand">' + escapeHtml(menu ? menu.name : '') + ' (' + (restState.mealType === 'set' ? '세트' : '단품') + ')</div>' +
              '<span class="kiosk-machine-tag">4단계 · 추가 메뉴 및 수량</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<h2 class="step-heading">1) 추가 메뉴를 고르시겠어요? (선택 사항)</h2>' +
              '<p class="step-sub">원하시는 추가 메뉴를 여러 개 누르거나, 필요 없으면 선택하지 않으셔도 됩니다.</p>' +
              '<div class="choice-grid-menu" style="margin-bottom:14px;">' +
                RESTAURANT_ADDONS.map(function (addon) {
                  const isSel = restState.selectedAddonIds.indexOf(addon.id) !== -1;
                  return (
                    '<button type="button" class="choice-card ' + (isSel ? 'selected' : '') + '" data-rest-addon="' + addon.id + '" style="min-height:125px;">' +
                      '<span class="choice-title">' + escapeHtml(addon.name) + '</span>' +
                      '<span class="choice-price">+ ' + formatWon(addon.price) + '</span>' +
                    '</button>'
                  );
                }).join('') +
              '</div>' +
              (restState.selectedAddonIds.length > 0
                ? '<div style="margin-bottom:22px;"><button type="button" class="btn btn-secondary" id="restClearAddonsBtn" style="min-height:48px;">추가 메뉴 모두 해제</button></div>'
                : '<div style="margin-bottom:22px; color:var(--text-sub); font-weight:700;">현재 선택된 추가 메뉴가 없습니다.</div>') +

              '<h2 class="step-heading">2) 주문 수량을 선택해 주세요</h2>' +
              '<div class="qty-box">' +
                '<button type="button" class="qty-btn" id="restQtyMinus" aria-label="수량 1 줄이기" ' + (restState.qty <= 1 ? 'disabled' : '') + '>−</button>' +
                '<span class="qty-value">' + restState.qty + '개</span>' +
                '<button type="button" class="qty-btn" id="restQtyPlus" aria-label="수량 1 늘리기" ' + (restState.qty >= 9 ? 'disabled' : '') + '>+</button>' +
              '</div>' +

              '<div class="total-price-bar">' +
                '<span class="total-price-label">현재 선택 합계 금액</span>' +
                '<span class="total-price-amount">' + formatWon(subTotal) + '</span>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }

      if (s === 4) {
        const total = getRestCartTotal();
        const totalQty = restState.cart.reduce(function (a, b) { return a + b.qty; }, 0);
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-restaurant">' +
              '<div class="kiosk-machine-brand">든든 버거 키오스크 · 장바구니</div>' +
              '<span class="kiosk-machine-tag">총 ' + totalQty + '개</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:16px;">' +
                '<div>' +
                  '<h2 class="step-heading" style="margin-bottom:4px;">주문할 음식을 확인해 주세요</h2>' +
                  '<p class="step-sub" style="margin-bottom:0;">이용 방식: <strong>' + diningLabel + '</strong></p>' +
                '</div>' +
                '<div style="display:flex; gap:10px; flex-wrap:wrap;">' +
                  '<button type="button" class="btn btn-secondary" id="restChangeDiningBtn">매장·포장 변경</button>' +
                  '<button type="button" class="btn btn-outline" id="restAddMoreBtn">+ 음식 더 추가하기</button>' +
                '</div>' +
              '</div>' +

              (restState.cart.length === 0
                ? '<div class="summary-box" style="text-align:center; padding:34px 20px;">' +
                    '<p style="font-weight:800; margin:0 0 16px;">장바구니에 담긴 음식이 없습니다.</p>' +
                    '<button type="button" class="btn btn-primary" id="restEmptyAddBtn">음식 고르러 가기</button>' +
                  '</div>'
                : restState.cart.map(function (item, idx) {
                    const addonText = item.addons.length > 0
                      ? '추가: ' + item.addons.map(function (a) { return a.name; }).join(', ')
                      : '추가 메뉴 없음';
                    return (
                      '<div class="cart-item-card">' +
                        '<div class="cart-item-top">' +
                          '<div>' +
                            '<div style="font-size:1.18rem; font-weight:900;">' + escapeHtml(item.name) + ' (' + (item.mealType === 'set' ? '세트' : '단품') + ')</div>' +
                            '<div style="color:var(--text-sub); font-size:0.9rem;">' + escapeHtml(addonText) + '</div>' +
                          '</div>' +
                          '<div style="font-size:1.25rem; font-weight:900; color:var(--royal-blue);">' +
                            formatWon(item.unitPrice * item.qty) +
                          '</div>' +
                        '</div>' +
                        '<div class="cart-item-controls">' +
                          '<div style="display:flex; align-items:center; gap:10px;">' +
                            '<button type="button" class="qty-btn small" data-rest-cart-minus="' + idx + '" aria-label="수량 줄이기">−</button>' +
                            '<span style="font-size:1.2rem; font-weight:900; min-width:44px; text-align:center;">' + item.qty + '개</span>' +
                            '<button type="button" class="qty-btn small" data-rest-cart-plus="' + idx + '" aria-label="수량 늘리기">+</button>' +
                          '</div>' +
                          '<div style="display:flex; gap:8px; flex-wrap:wrap;">' +
                            '<button type="button" class="btn btn-secondary" style="min-height:48px; padding:8px 14px;" data-rest-cart-edit="' + idx + '">옵션 수정</button>' +
                            '<button type="button" class="btn btn-danger-outline" style="min-height:48px; padding:8px 14px;" data-rest-cart-del="' + idx + '">삭제</button>' +
                          '</div>' +
                        '</div>' +
                      '</div>'
                    );
                  }).join('')
              ) +

              '<div class="total-price-bar">' +
                '<span class="total-price-label">총 주문 금액 (' + totalQty + '개)</span>' +
                '<span class="total-price-amount">' + formatWon(total) + '</span>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }

      if (s === 5) {
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-restaurant">' +
              '<div class="kiosk-machine-brand">든든 버거 키오스크 · 결제 방법</div>' +
              '<span class="kiosk-machine-tag">6단계 · 결제 수단 선택</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<h2 class="step-heading">결제 방법을 선택해 주세요</h2>' +
              '<p class="step-sub">연습용 화면이므로 실제 결제는 진행되지 않습니다.</p>' +
              '<div class="total-price-bar" style="margin-top:0; margin-bottom:20px;">' +
                '<span class="total-price-label">결제할 연습용 금액</span>' +
                '<span class="total-price-amount">' + formatWon(getRestCartTotal()) + '</span>' +
              '</div>' +
              '<div class="choice-grid-2">' +
                '<button type="button" class="choice-card ' + (restState.paymentMethod === 'card' ? 'selected' : '') + '" data-rest-pay="card" style="min-height:190px;">' +
                  '<svg width="74" height="54" viewBox="0 0 74 54" fill="none" aria-hidden="true">' +
                    '<rect x="3" y="4" width="68" height="46" rx="8" fill="#2458A6"/>' +
                    '<rect x="3" y="14" width="68" height="8" fill="#172B4D"/>' +
                    '<rect x="12" y="29" width="16" height="11" rx="2.5" fill="#F5CF69"/>' +
                  '</svg>' +
                  '<span class="choice-title">신용·체크카드 결제</span>' +
                  '<span class="choice-sub">가상 카드 투입 버튼으로 결제 연습해요 (추천)</span>' +
                '</button>' +
                '<button type="button" class="choice-card ' + (restState.paymentMethod === 'mobile' ? 'selected' : '') + '" data-rest-pay="mobile" style="min-height:190px;">' +
                  '<svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">' +
                    '<rect x="18" y="6" width="28" height="52" rx="6" fill="#DCEBFC" stroke="#2458A6" stroke-width="3"/>' +
                    '<rect x="24" y="18" width="16" height="22" rx="2" fill="#2458A6"/>' +
                    '<circle cx="32" cy="49" r="2.5" fill="#2458A6"/>' +
                  '</svg>' +
                  '<span class="choice-title">모바일 간편결제</span>' +
                  '<span class="choice-sub">휴대폰 바코드 결제를 연습해요</span>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }

      if (s === 6) {
        return renderCardPaymentStep({
          themeClass: 'theme-restaurant',
          brandName: '든든 버거 키오스크',
          totalAmount: getRestCartTotal(),
          paymentMethod: restState.paymentMethod,
          cardInserted: restState.cardInserted,
          completeButtonLabel: '주문 완료하고 주문번호 확인하기 →'
        });
      }

      // Step 7: Completion
      const total = getRestCartTotal();
      return (
        '<div class="result-hero">' +
          '<div class="result-check-circle" aria-hidden="true">' +
            '<svg width="40" height="40" viewBox="0 0 24 24" fill="none">' +
              '<path d="M5 13L9.5 17.5L19 7" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>' +
          '</div>' +
          '<h2 class="result-title">음식점 주문 연습이 완료되었습니다!</h2>' +
          '<p class="result-subtitle">실제 주문과 결제는 이루어지지 않았습니다. 정말 잘 하셨어요!</p>' +
        '</div>' +

        '<div class="result-big-number-box">' +
          '<div class="result-big-label">연습용 주문번호</div>' +
          '<div class="result-big-value">' + escapeHtml(restState.orderNumber) + '</div>' +
        '</div>' +

        '<div class="card">' +
          '<h3 style="margin:0 0 14px; font-size:1.25rem; color:var(--royal-blue);">주문 내역 확인</h3>' +
          '<div class="summary-box">' +
            '<div class="summary-row"><span class="summary-label">이용 방법</span><span class="summary-val">' + diningLabel + '</span></div>' +
            '<div class="summary-row"><span class="summary-label">결제 방법</span><span class="summary-val">' + (restState.paymentMethod === 'card' ? '신용·체크카드 (연습용)' : '모바일 간편결제 (연습용)') + '</span></div>' +
            restState.cart.map(function (item) {
              const addonText = item.addons.length > 0
                ? ' / 추가: ' + item.addons.map(function (a) { return a.name; }).join(', ')
                : '';
              return (
                '<div class="summary-row">' +
                  '<span class="summary-label">' +
                    '<strong>' + escapeHtml(item.name) + '</strong> (' +
                    (item.mealType === 'set' ? '세트' : '단품') + escapeHtml(addonText) + ') × ' + item.qty + '개' +
                  '</span>' +
                  '<span class="summary-val">' + formatWon(item.unitPrice * item.qty) + '</span>' +
                '</div>'
              );
            }).join('') +
          '</div>' +
          '<div class="total-price-bar">' +
            '<span class="total-price-label">총 연습 결제 금액</span>' +
            '<span class="total-price-amount">' + formatWon(total) + '</span>' +
          '</div>' +
        '</div>' +
        renderResultFooterButtons('restaurant')
      );
    },
    bindEvents: function (container) {
      container.querySelectorAll('[data-rest-dining]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          restState.dining = btn.dataset.restDining;
          renderActiveKiosk();
        });
      });
      container.querySelectorAll('[data-rest-cat]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          restState.category = btn.dataset.restCat;
          renderActiveKiosk();
        });
      });
      container.querySelectorAll('[data-rest-menu]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          restState.selectedMenuId = btn.dataset.restMenu;
          renderActiveKiosk();
        });
      });
      const jumpCart = container.querySelector('#restJumpCartBtn');
      if (jumpCart) {
        jumpCart.addEventListener('click', function () {
          restState.step = 4;
          renderActiveKiosk();
        });
      }
      container.querySelectorAll('[data-rest-meal]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          restState.mealType = btn.dataset.restMeal;
          renderActiveKiosk();
        });
      });
      container.querySelectorAll('[data-rest-addon]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const id = btn.dataset.restAddon;
          const idx = restState.selectedAddonIds.indexOf(id);
          if (idx === -1) restState.selectedAddonIds.push(id);
          else restState.selectedAddonIds.splice(idx, 1);
          renderActiveKiosk();
        });
      });
      const clearAddons = container.querySelector('#restClearAddonsBtn');
      if (clearAddons) {
        clearAddons.addEventListener('click', function () {
          restState.selectedAddonIds = [];
          renderActiveKiosk();
        });
      }
      const qtyMinus = container.querySelector('#restQtyMinus');
      const qtyPlus = container.querySelector('#restQtyPlus');
      if (qtyMinus) {
        qtyMinus.addEventListener('click', function () {
          if (restState.qty > 1) {
            restState.qty -= 1;
            renderActiveKiosk();
          }
        });
      }
      if (qtyPlus) {
        qtyPlus.addEventListener('click', function () {
          if (restState.qty < 9) {
            restState.qty += 1;
            renderActiveKiosk();
          }
        });
      }
      const addMore = container.querySelector('#restAddMoreBtn');
      const emptyAdd = container.querySelector('#restEmptyAddBtn');
      if (addMore) {
        addMore.addEventListener('click', function () {
          resetRestDraft();
          restState.step = 1;
          renderActiveKiosk();
        });
      }
      if (emptyAdd) {
        emptyAdd.addEventListener('click', function () {
          resetRestDraft();
          restState.step = 1;
          renderActiveKiosk();
        });
      }
      const changeDining = container.querySelector('#restChangeDiningBtn');
      if (changeDining) {
        changeDining.addEventListener('click', function () {
          restState.dining = restState.dining === 'dine_in' ? 'take_out' : 'dine_in';
          renderActiveKiosk();
        });
      }
      container.querySelectorAll('[data-rest-cart-minus]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const i = Number(btn.dataset.restCartMinus);
          if (restState.cart[i] && restState.cart[i].qty > 1) {
            restState.cart[i].qty -= 1;
            renderActiveKiosk();
          }
        });
      });
      container.querySelectorAll('[data-rest-cart-plus]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const i = Number(btn.dataset.restCartPlus);
          if (restState.cart[i] && restState.cart[i].qty < 9) {
            restState.cart[i].qty += 1;
            renderActiveKiosk();
          }
        });
      });
      container.querySelectorAll('[data-rest-cart-edit]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const i = Number(btn.dataset.restCartEdit);
          const target = restState.cart[i];
          if (target) {
            restState.selectedMenuId = target.menuId;
            restState.mealType = target.mealType;
            restState.selectedAddonIds = target.addons.map(function (a) { return a.id; });
            restState.qty = target.qty;
            restState.editingIndex = i;
            restState.step = 2;
            renderActiveKiosk();
          }
        });
      });
      container.querySelectorAll('[data-rest-cart-del]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const i = Number(btn.dataset.restCartDel);
          restState.cart.splice(i, 1);
          renderActiveKiosk();
        });
      });
      container.querySelectorAll('[data-rest-pay]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          restState.paymentMethod = btn.dataset.restPay;
          renderActiveKiosk();
        });
      });
      const insertBtn = container.querySelector('#virtualCardInsertBtn');
      if (insertBtn) {
        insertBtn.addEventListener('click', function () {
          restState.cardInserted = true;
          renderActiveKiosk();
        });
      }
      const completeBtn = container.querySelector('#virtualCardCompleteBtn');
      if (completeBtn) {
        completeBtn.addEventListener('click', function () {
          restState.orderNumber = randomOrderCode('F');
          restState.step = 7;
          renderActiveKiosk();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
      bindResultFooterButtons(container);
    }
  };

  /* ================= 3. HOSPITAL KIOSK MODULE ================= */
  const PRACTICE_PATIENTS = [
    { id: 'p1', name: '김연습 어르신', birth: '1952년 03월 15일 (가상)', code: '연습번호 H-001' },
    { id: 'p2', name: '이행복 어르신', birth: '1956년 08월 22일 (가상)', code: '연습번호 H-002' },
    { id: 'p3', name: '박건강 어르신', birth: '1949년 11월 04일 (가상)', code: '연습번호 H-003' }
  ];

  const HOSPITAL_DEPTS = [
    { id: 'internal', name: '내과', desc: '감기 · 혈압 · 소화불량', room: '본관 2층 내과 1진료실 (연습용)' },
    { id: 'ortho', name: '정형외과', desc: '무릎 · 허리 · 관절 통증', room: '본관 2층 정형외과 2진료실 (연습용)' },
    { id: 'eye', name: '안과', desc: '시력 · 눈 침침함 · 건조함', room: '본관 3층 안과 진료실 (연습용)' },
    { id: 'ent', name: '이비인후과', desc: '귀 · 코 · 목 불편함', room: '본관 3층 이비인후과 진료실 (연습용)' },
    { id: 'skin', name: '피부과', desc: '피부 가려움 · 피부 질환', room: '신관 2층 피부과 진료실 (연습용)' },
    { id: 'family', name: '가정의학과', desc: '건강 상담 · 예방접종', room: '본관 1층 가정의학과 진료실 (연습용)' }
  ];

  function renderDeptSvg(deptId) {
    if (deptId === 'internal') {
      return '<svg width="58" height="58" viewBox="0 0 60 60" fill="none" aria-hidden="true"><circle cx="30" cy="30" r="25" fill="#DCEBFC"/><path d="M20 16V27C20 32.5 24.5 37 30 37C35.5 37 40 32.5 40 27V16" stroke="#2458A6" stroke-width="3.2" stroke-linecap="round"/><path d="M30 37V44C30 47.5 33 50 37 50C41 50 44 47.5 44 44V39" stroke="#2458A6" stroke-width="3.2" stroke-linecap="round"/><circle cx="44" cy="36" r="4" fill="#287A4B"/></svg>';
    }
    if (deptId === 'ortho') {
      return '<svg width="58" height="58" viewBox="0 0 60 60" fill="none" aria-hidden="true"><circle cx="30" cy="30" r="25" fill="#DCEBFC"/><path d="M22 18C19 18 17 20.5 18 23.2L22 25L35 38L36.8 42C39.5 43 42 41 42 38C42 36.2 40.8 34.8 39 34.3L26 21.3C25.5 19.5 24 18 22 18Z" fill="#FFFFFF" stroke="#2458A6" stroke-width="2.8" stroke-linejoin="round"/></svg>';
    }
    if (deptId === 'eye') {
      return '<svg width="58" height="58" viewBox="0 0 60 60" fill="none" aria-hidden="true"><circle cx="30" cy="30" r="25" fill="#DCEBFC"/><path d="M11 30C16 21 23 18 30 18C37 18 44 21 49 30C44 39 37 42 30 42C23 42 16 39 11 30Z" fill="#FFFFFF" stroke="#2458A6" stroke-width="2.8"/><circle cx="30" cy="30" r="7" fill="#2458A6"/><circle cx="32" cy="28" r="2.2" fill="#FFFFFF"/></svg>';
    }
    if (deptId === 'ent') {
      return '<svg width="58" height="58" viewBox="0 0 60 60" fill="none" aria-hidden="true"><circle cx="30" cy="30" r="25" fill="#DCEBFC"/><path d="M23 26C23 19.5 27.5 16 33 16C38.5 16 42 20 42 25.5C42 31.5 36.5 34 35.5 38.5C34.8 41.5 32.5 44 29.5 44C26.5 44 24.5 42 24.5 39.5" stroke="#2458A6" stroke-width="3.2" stroke-linecap="round"/><path d="M29 25C29 22.5 31 21 33 21C35.2 21 36.8 22.8 36.8 25C36.8 27.5 34.5 29 33 31" stroke="#287A4B" stroke-width="2.8" stroke-linecap="round"/></svg>';
    }
    if (deptId === 'skin') {
      return '<svg width="58" height="58" viewBox="0 0 60 60" fill="none" aria-hidden="true"><circle cx="30" cy="30" r="25" fill="#DCEBFC"/><path d="M30 14C23 23 18 29.5 18 36C18 42.6 23.4 47 30 47C36.6 47 42 42.6 42 36C42 29.5 37 23 30 14Z" fill="#91BDF2" stroke="#2458A6" stroke-width="2.8"/><circle cx="26" cy="36" r="3" fill="#FFFFFF"/></svg>';
    }
    return '<svg width="58" height="58" viewBox="0 0 60 60" fill="none" aria-hidden="true"><circle cx="30" cy="30" r="25" fill="#DCEBFC"/><path d="M16 31L30 18L44 31V45H16V31Z" fill="#FFFFFF" stroke="#2458A6" stroke-width="2.8" stroke-linejoin="round"/><rect x="27" y="28" width="6" height="12" rx="1.5" fill="#287A4B"/><rect x="24" y="31" width="12" height="6" rx="1.5" fill="#287A4B"/></svg>';
  }

  const HOSP_STEPS = [
    '방문 유형',
    '환자정보 선택',
    '진료과 선택',
    '접수 내용 확인',
    '접수 완료'
  ];

  const hospState = {
    step: 0,
    visitType: null, // 'first' | 'revisit'
    patientId: null,
    deptId: null,
    waitNumber: ''
  };

  function getPracticePatient(id) {
    return PRACTICE_PATIENTS.find(function (p) { return p.id === id; }) || null;
  }

  function getHospitalDept(id) {
    return HOSPITAL_DEPTS.find(function (d) { return d.id === id; }) || null;
  }

  KIOSK_MODULES.hospital = {
    reset: function () {
      hospState.step = 0;
      hospState.visitType = null;
      hospState.patientId = null;
      hospState.deptId = null;
      hospState.waitNumber = '';
    },
    getMeta: function () {
      const guides = [
        '병원에 처음 오셨는지, 이전에 오신 적이 있는지 선택해 주세요.',
        '실제 개인정보는 입력하지 않습니다. 아래 준비된 연습용 가상 환자정보 중 하나를 골라 주세요.',
        '진료받고 싶은 진료과를 선택해 주세요. 증상 설명을 보고 천천히 고르셔도 됩니다.',
        '선택하신 접수 내용을 확인해 주세요. 바꿀 내용이 있으면 수정 버튼을 눌러 고칠 수 있어요.',
        '참 잘 하셨어요! 병원 키오스크 접수 연습을 무사히 마치셨습니다.'
      ];
      const nextLabels = [
        '다음 단계 (환자정보 선택) →',
        '다음 단계 (진료과 선택) →',
        '다음 단계 (접수 내용 확인) →',
        '연습 접수 완료하기 →',
        ''
      ];
      return {
        title: '병원 키오스크 접수 연습',
        steps: HOSP_STEPS,
        stepIndex: hospState.step,
        teacherMessage: guides[hospState.step],
        nextLabel: nextLabels[hospState.step],
        isResult: hospState.step === 4,
        hideNextButton: false
      };
    },
    prev: function () {
      if (hospState.step > 0) hospState.step -= 1;
    },
    next: function () {
      if (hospState.step === 0) {
        if (!hospState.visitType) return '처음 방문인지, 재방문인지 먼저 선택해 주세요.';
        hospState.step = 1;
        return null;
      }
      if (hospState.step === 1) {
        if (!hospState.patientId) return '연습용 환자정보 중 한 분을 선택해 주세요.';
        hospState.step = 2;
        return null;
      }
      if (hospState.step === 2) {
        if (!hospState.deptId) return '진료받으실 진료과를 하나 선택해 주세요.';
        hospState.step = 3;
        return null;
      }
      if (hospState.step === 3) {
        hospState.waitNumber = '대기 ' + Math.floor(11 + Math.random() * 28) + '번';
        hospState.step = 4;
        return null;
      }
      return null;
    },
    render: function () {
      const s = hospState.step;
      const visitLabel = hospState.visitType === 'first' ? '처음 방문 (초진)' : (hospState.visitType === 'revisit' ? '다시 방문 (재진)' : '');
      const patient = getPracticePatient(hospState.patientId);
      const dept = getHospitalDept(hospState.deptId);

      if (s === 0) {
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-hospital">' +
              '<div class="kiosk-machine-brand">행복 종합병원 무인 접수기</div>' +
              '<span class="kiosk-machine-tag">1단계 · 방문 구분</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<h2 class="step-heading">이 병원에 처음 방문하셨나요?</h2>' +
              '<p class="step-sub">처음 방문과 재방문 중 해당되는 버튼을 눌러 주세요.</p>' +
              '<div class="choice-grid-2">' +
                '<button type="button" class="choice-card ' + (hospState.visitType === 'first' ? 'selected' : '') + '" data-hosp-visit="first" style="min-height:210px;">' +
                  '<svg width="68" height="68" viewBox="0 0 68 68" fill="none" aria-hidden="true">' +
                    '<circle cx="34" cy="34" r="28" fill="#DCEBFC"/>' +
                    '<path d="M34 18V50M18 34H50" stroke="#2458A6" stroke-width="5" stroke-linecap="round"/>' +
                  '</svg>' +
                  '<span class="choice-title">처음 방문 (초진)</span>' +
                  '<span class="choice-sub">이 병원에 처음 오신 경우 눌러 주세요</span>' +
                '</button>' +
                '<button type="button" class="choice-card ' + (hospState.visitType === 'revisit' ? 'selected' : '') + '" data-hosp-visit="revisit" style="min-height:210px;">' +
                  '<svg width="68" height="68" viewBox="0 0 68 68" fill="none" aria-hidden="true">' +
                    '<circle cx="34" cy="34" r="28" fill="#E4F5EC"/>' +
                    '<path d="M22 35L30 43L47 25" stroke="#287A4B" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
                  '</svg>' +
                  '<span class="choice-title">재방문 (재진)</span>' +
                  '<span class="choice-sub">이전에 진료받은 적이 있으면 눌러 주세요</span>' +
                '</button>' +
              '</div>' +
              '<div class="notice-box">안내: 실제 병원에 접수되지 않으며, 병원마다 접수 절차와 화면 구성은 조금씩 다를 수 있습니다.</div>' +
            '</div>' +
          '</div>'
        );
      }

      if (s === 1) {
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-hospital">' +
              '<div class="kiosk-machine-brand">행복 종합병원 무인 접수기 · ' + visitLabel + '</div>' +
              '<span class="kiosk-machine-tag">2단계 · 가상 환자정보</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<h2 class="step-heading">연습용 환자정보를 선택해 주세요</h2>' +
              '<p class="step-sub">개인정보 보호를 위해 실제 이름이나 주민등록번호를 입력하지 않고, 아래 가상의 연습용 환자정보를 사용합니다.</p>' +
              '<div class="choice-grid-3">' +
                PRACTICE_PATIENTS.map(function (p) {
                  const sel = hospState.patientId === p.id ? 'selected' : '';
                  return (
                    '<button type="button" class="choice-card ' + sel + '" data-hosp-patient="' + p.id + '" style="min-height:195px;">' +
                      '<svg width="60" height="60" viewBox="0 0 60 60" fill="none" aria-hidden="true">' +
                        '<circle cx="30" cy="30" r="26" fill="#DCEBFC" stroke="#2458A6" stroke-width="2.5"/>' +
                        '<circle cx="30" cy="23" r="8" fill="#2458A6"/>' +
                        '<path d="M16 45C17.5 37 22.8 33 30 33C37.2 33 42.5 37 44 45" fill="#91BDF2"/>' +
                      '</svg>' +
                      '<span class="choice-title">' + escapeHtml(p.name) + '</span>' +
                      '<span class="choice-sub">' + escapeHtml(p.birth) + '</span>' +
                      '<span class="choice-sub" style="font-weight:800; color:var(--royal-blue);">' + escapeHtml(p.code) + '</span>' +
                    '</button>'
                  );
                }).join('') +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }

      if (s === 2) {
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-hospital">' +
              '<div class="kiosk-machine-brand">행복 종합병원 · ' + escapeHtml(patient ? patient.name : '') + '</div>' +
              '<span class="kiosk-machine-tag">3단계 · 진료과 선택</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<h2 class="step-heading">진료받으실 진료과를 선택해 주세요</h2>' +
              '<p class="step-sub">아래 6개 진료과 중 원하시는 과를 눌러 주세요.</p>' +
              '<div class="choice-grid-3">' +
                HOSPITAL_DEPTS.map(function (d) {
                  const sel = hospState.deptId === d.id ? 'selected' : '';
                  return (
                    '<button type="button" class="choice-card ' + sel + '" data-hosp-dept="' + d.id + '" style="min-height:185px;">' +
                      renderDeptSvg(d.id) +
                      '<span class="choice-title">' + escapeHtml(d.name) + '</span>' +
                      '<span class="choice-sub">' + escapeHtml(d.desc) + '</span>' +
                    '</button>'
                  );
                }).join('') +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }

      if (s === 3) {
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-hospital">' +
              '<div class="kiosk-machine-brand">행복 종합병원 무인 접수기 · 내용 확인</div>' +
              '<span class="kiosk-machine-tag">4단계 · 접수 전 확인</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<h2 class="step-heading">입력하신 접수 내용이 맞는지 확인해 주세요</h2>' +
              '<p class="step-sub">수정이 필요하면 옆의 "수정하기" 버튼을 눌러 바로 고칠 수 있습니다.</p>' +
              '<div class="summary-box">' +
                '<div class="summary-row">' +
                  '<span class="summary-label">방문 구분</span>' +
                  '<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">' +
                    '<span class="summary-val">' + visitLabel + '</span>' +
                    '<button type="button" class="btn btn-secondary" style="min-height:44px; padding:6px 14px;" data-hosp-edit="0">수정하기</button>' +
                  '</div>' +
                '</div>' +
                '<div class="summary-row">' +
                  '<span class="summary-label">연습용 환자정보</span>' +
                  '<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">' +
                    '<span class="summary-val">' + escapeHtml(patient ? patient.name + ' (' + patient.code + ')' : '') + '</span>' +
                    '<button type="button" class="btn btn-secondary" style="min-height:44px; padding:6px 14px;" data-hosp-edit="1">수정하기</button>' +
                  '</div>' +
                '</div>' +
                '<div class="summary-row">' +
                  '<span class="summary-label">선택한 진료과</span>' +
                  '<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">' +
                    '<span class="summary-val" style="color:var(--royal-blue); font-size:1.18rem;">' + escapeHtml(dept ? dept.name : '') + '</span>' +
                    '<button type="button" class="btn btn-secondary" style="min-height:44px; padding:6px 14px;" data-hosp-edit="2">수정하기</button>' +
                  '</div>' +
                '</div>' +
                '<div class="summary-row">' +
                  '<span class="summary-label">가상 진료 장소</span>' +
                  '<span class="summary-val">' + escapeHtml(dept ? dept.room : '') + '</span>' +
                '</div>' +
              '</div>' +
              '<div class="notice-box">' +
                '안내: 이 화면은 교육용 연습 화면이며 실제 병원 접수는 이루어지지 않습니다. 또한 실제 병원마다 접수 절차와 순서가 다를 수 있습니다.' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }

      // Step 4: Completion
      return (
        '<div class="result-hero">' +
          '<div class="result-check-circle" aria-hidden="true">' +
            '<svg width="40" height="40" viewBox="0 0 24 24" fill="none">' +
              '<path d="M5 13L9.5 17.5L19 7" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>' +
          '</div>' +
          '<h2 class="result-title">병원 접수 연습이 완료되었습니다!</h2>' +
          '<p class="result-subtitle">실제 병원에 접수되거나 개인정보가 저장되지 않았습니다. 수고하셨어요!</p>' +
        '</div>' +

        '<div class="result-big-number-box">' +
          '<div class="result-big-label">연습용 대기번호</div>' +
          '<div class="result-big-value">' + escapeHtml(hospState.waitNumber) + '</div>' +
          '<div style="margin-top:10px; font-weight:800; color:var(--green-dark); font-size:1.1rem;">' +
            escapeHtml(dept ? dept.room : '') +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<h3 style="margin:0 0 14px; font-size:1.25rem; color:var(--royal-blue);">연습용 접수증 내용</h3>' +
          '<div class="summary-box">' +
            '<div class="summary-row"><span class="summary-label">선택한 진료과</span><span class="summary-val" style="color:var(--royal-blue);">' + escapeHtml(dept ? dept.name : '') + '</span></div>' +
            '<div class="summary-row"><span class="summary-label">가상 진료 장소</span><span class="summary-val">' + escapeHtml(dept ? dept.room : '') + '</span></div>' +
            '<div class="summary-row"><span class="summary-label">방문 구분</span><span class="summary-val">' + visitLabel + '</span></div>' +
            '<div class="summary-row"><span class="summary-label">연습용 환자정보</span><span class="summary-val">' + escapeHtml(patient ? patient.name + ' · ' + patient.code : '') + '</span></div>' +
          '</div>' +
          '<div class="notice-box">' +
            '꼭 기억해 주세요: 실제 병원마다 접수 방법과 순서가 다를 수 있으며, 어려운 점이 있으면 병원 안내 데스크 직원에게 편하게 도움을 요청하셔도 됩니다.' +
          '</div>' +
        '</div>' +
        renderResultFooterButtons('hospital')
      );
    },
    bindEvents: function (container) {
      container.querySelectorAll('[data-hosp-visit]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          hospState.visitType = btn.dataset.hospVisit;
          renderActiveKiosk();
        });
      });
      container.querySelectorAll('[data-hosp-patient]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          hospState.patientId = btn.dataset.hospPatient;
          renderActiveKiosk();
        });
      });
      container.querySelectorAll('[data-hosp-dept]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          hospState.deptId = btn.dataset.hospDept;
          renderActiveKiosk();
        });
      });
      container.querySelectorAll('[data-hosp-edit]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          hospState.step = Number(btn.dataset.hospEdit);
          renderActiveKiosk();
        });
      });
      bindResultFooterButtons(container);
    }
  };

  /* ================= 4. SUBWAY TICKET KIOSK MODULE ================= */
  const SUBWAY_STATIONS = [
    { id: 'jungang', name: '연습용 중앙역', zone: '1구간', baseFare: 1400, minutes: '약 5분 (연습)' },
    { id: 'haengbok', name: '연습용 행복역', zone: '2구간', baseFare: 1600, minutes: '약 10분 (연습)' },
    { id: 'simin', name: '연습용 시민역', zone: '3구간', baseFare: 1800, minutes: '약 15분 (연습)' },
    { id: 'munhwa', name: '연습용 문화역', zone: '4구간', baseFare: 2000, minutes: '약 20분 (연습)' },
    { id: 'gongwon', name: '연습용 공원역', zone: '5구간', baseFare: 2200, minutes: '약 25분 (연습)' }
  ];

  const SUBWAY_TICKET_TYPES = [
    { id: 'regular', name: '일반 승차권', desc: '1회 편도 승차권 (기본 연습 요금)', multiplier: 1 },
    { id: 'discount', name: '우대 연습 승차권', desc: '연습용 50% 할인 요금 (실제 제도와 다를 수 있음)', multiplier: 0.5 },
    { id: 'roundtrip', name: '왕복 승차권', desc: '갈 때와 올 때 모두 이용 (기본 요금 × 2)', multiplier: 2 }
  ];

  const SUBWAY_STEPS = [
    '승차권 구매',
    '목적지 선택',
    '승차권 종류',
    '수량 선택',
    '요금·결제 확인',
    '모의 결제',
    '발급 완료'
  ];

  const subwayState = {
    step: 0,
    startedPurchase: false,
    stationId: null,
    ticketTypeId: null,
    qty: 1,
    paymentMethod: null,
    cardInserted: false,
    ticketCode: ''
  };

  function getSubwayStation(id) {
    return SUBWAY_STATIONS.find(function (st) { return st.id === id; }) || null;
  }

  function getSubwayTicketType(id) {
    return SUBWAY_TICKET_TYPES.find(function (t) { return t.id === id; }) || null;
  }

  function getSubwayUnitFare(station, ticketType) {
    if (!station || !ticketType) return 0;
    return Math.round(station.baseFare * ticketType.multiplier);
  }

  function getSubwayTotalFare() {
    const st = getSubwayStation(subwayState.stationId);
    const tt = getSubwayTicketType(subwayState.ticketTypeId);
    return getSubwayUnitFare(st, tt) * subwayState.qty;
  }

  function renderSubwayLineSvg(selectedId) {
    const nodes = [{ id: 'start', label: '출발역', x: 55 }].concat(
      SUBWAY_STATIONS.map(function (st, idx) {
        return { id: st.id, label: st.name.replace('연습용 ', ''), x: 165 + idx * 110 };
      })
    );
    return (
      '<svg width="100%" viewBox="0 0 660 88" style="min-width:520px; display:block;" aria-hidden="true">' +
        '<line x1="55" y1="34" x2="605" y2="34" stroke="#2458A6" stroke-width="8" stroke-linecap="round"/>' +
        nodes.map(function (n) {
          const isStart = n.id === 'start';
          const isSel = n.id === selectedId;
          const fill = isStart ? '#287A4B' : (isSel ? '#F5CF69' : '#FFFFFF');
          const stroke = isSel ? '#172B4D' : '#2458A6';
          const r = isSel ? 13 : 10;
          return (
            '<circle cx="' + n.x + '" cy="34" r="' + r + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="3.5"/>' +
            '<text x="' + n.x + '" y="68" text-anchor="middle" font-size="14" font-weight="800" fill="' + (isSel ? '#2458A6' : '#172B4D') + '">' +
              escapeHtml(n.label) +
            '</text>'
          );
        }).join('') +
      '</svg>'
    );
  }

  KIOSK_MODULES.subway = {
    reset: function () {
      subwayState.step = 0;
      subwayState.startedPurchase = false;
      subwayState.stationId = null;
      subwayState.ticketTypeId = null;
      subwayState.qty = 1;
      subwayState.paymentMethod = null;
      subwayState.cardInserted = false;
      subwayState.ticketCode = '';
    },
    getMeta: function () {
      const guides = [
        '지하철 무인 승차권 발매기 첫 화면입니다. 아래 "1회용 승차권 구매하기" 큰 버튼을 눌러 시작해 보세요.',
        '도착하실 목적지 역을 선택해 주세요. 역마다 연습용 요금이 다르게 설정되어 있어요.',
        '구매하실 승차권 종류(일반, 우대 연습권, 왕복)를 선택해 주세요.',
        '필요한 승차권 매수를 + 와 - 버튼으로 맞춰 주세요.',
        '선택하신 목적지, 수량, 총 요금을 확인하고 결제 방법을 선택해 주세요.',
        '가상의 카드 투입 버튼을 눌러 모의 결제를 체험해 보세요. 실제 돈은 결제되지 않습니다.',
        '정말 잘 하셨어요! 지하철 승차권 구매 연습을 멋지게 완료하셨습니다.'
      ];
      const nextLabels = [
        '목적지 선택하러 가기 →',
        '다음 단계 (승차권 종류) →',
        '다음 단계 (수량 선택) →',
        '다음 단계 (요금·결제 확인) →',
        '모의 결제 화면으로 →',
        '승차권 발급 완료하기 →',
        ''
      ];
      return {
        title: '교통 승차권 구매 연습',
        steps: SUBWAY_STEPS,
        stepIndex: subwayState.step,
        teacherMessage: guides[subwayState.step],
        nextLabel: nextLabels[subwayState.step],
        isResult: subwayState.step === 6,
        hideNextButton: subwayState.step === 5 && !subwayState.cardInserted
      };
    },
    prev: function () {
      if (subwayState.step === 0) return;
      if (subwayState.step === 5) subwayState.cardInserted = false;
      subwayState.step -= 1;
    },
    next: function () {
      if (subwayState.step === 0) {
        if (!subwayState.startedPurchase) {
          return '먼저 화면 가운데의 "1회용 승차권 구매하기" 버튼을 눌러 주세요.';
        }
        subwayState.step = 1;
        return null;
      }
      if (subwayState.step === 1) {
        if (!subwayState.stationId) return '이동하실 목적지 역을 하나 선택해 주세요.';
        subwayState.step = 2;
        return null;
      }
      if (subwayState.step === 2) {
        if (!subwayState.ticketTypeId) return '승차권 종류(일반·우대·왕복)를 선택해 주세요.';
        subwayState.step = 3;
        return null;
      }
      if (subwayState.step === 3) {
        subwayState.step = 4;
        return null;
      }
      if (subwayState.step === 4) {
        if (!subwayState.paymentMethod) return '결제 방법(신용·체크카드 결제 등)을 선택해 주세요.';
        subwayState.cardInserted = false;
        subwayState.step = 5;
        return null;
      }
      if (subwayState.step === 5) {
        if (!subwayState.cardInserted) return '먼저 "연습용 카드 투입하기" 버튼을 눌러 주세요.';
        subwayState.ticketCode = randomOrderCode('T');
        subwayState.step = 6;
        return null;
      }
      return null;
    },
    render: function () {
      const s = subwayState.step;
      const station = getSubwayStation(subwayState.stationId);
      const ticketType = getSubwayTicketType(subwayState.ticketTypeId);

      if (s === 0) {
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-subway">' +
              '<div class="kiosk-machine-brand">지하철 무인 승차권 발매기</div>' +
              '<span class="kiosk-machine-tag">출발역 · 연습용 출발역</span>' +
            '</div>' +
            '<div class="kiosk-screen-body" style="text-align:center;">' +
              '<h2 class="step-heading">무인 승차권 발매기에 오신 것을 환영합니다</h2>' +
              '<p class="step-sub">교육용 가상 지하철역과 요금으로 승차권 구매를 연습해 보아요.</p>' +
              '<div style="max-width:440px; margin:20px auto 12px;">' +
                '<button type="button" class="choice-card ' + (subwayState.startedPurchase ? 'selected' : '') + '" id="subwayStartBtn" style="width:100%; min-height:220px;">' +
                  '<svg width="84" height="64" viewBox="0 0 84 64" fill="none" aria-hidden="true">' +
                    '<rect x="6" y="8" width="72" height="48" rx="10" fill="#DCEBFC" stroke="#2458A6" stroke-width="3"/>' +
                    '<rect x="6" y="8" width="72" height="16" rx="10" fill="#2458A6"/>' +
                    '<rect x="16" y="33" width="30" height="6" rx="3" fill="#2458A6"/>' +
                    '<rect x="16" y="43" width="20" height="5" rx="2.5" fill="#91BDF2"/>' +
                    '<circle cx="63" cy="40" r="8" fill="#F5CF69" stroke="#2458A6" stroke-width="2.5"/>' +
                  '</svg>' +
                  '<span class="choice-title" style="font-size:1.35rem;">1회용 승차권 구매하기</span>' +
                  '<span class="choice-sub">이 버튼을 누르면 목적지 선택으로 진행할 수 있어요</span>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }

      if (s === 1) {
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-subway">' +
              '<div class="kiosk-machine-brand">지하철 무인 발매기 · 목적지 선택</div>' +
              '<span class="kiosk-machine-tag">출발 · 연습용 출발역</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<h2 class="step-heading">어느 역으로 가시나요?</h2>' +
              '<p class="step-sub">아래 연습용 노선도와 역 버튼을 보고 목적지를 선택해 주세요.</p>' +
              '<div class="subway-line-strip">' +
                renderSubwayLineSvg(subwayState.stationId) +
              '</div>' +
              '<div class="choice-grid-menu">' +
                SUBWAY_STATIONS.map(function (st) {
                  const sel = subwayState.stationId === st.id ? 'selected' : '';
                  return (
                    '<button type="button" class="choice-card ' + sel + '" data-subway-station="' + st.id + '" style="min-height:155px;">' +
                      '<span style="display:inline-block; background:var(--royal-blue); color:#FFFFFF; font-size:0.78rem; font-weight:800; padding:3px 10px; border-radius:999px;">' + escapeHtml(st.zone) + '</span>' +
                      '<span class="choice-title">' + escapeHtml(st.name) + '</span>' +
                      '<span class="choice-sub">' + escapeHtml(st.minutes) + '</span>' +
                      '<span class="choice-price">기본 ' + formatWon(st.baseFare) + '</span>' +
                    '</button>'
                  );
                }).join('') +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }

      if (s === 2) {
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-subway">' +
              '<div class="kiosk-machine-brand">목적지 · ' + escapeHtml(station ? station.name : '') + '</div>' +
              '<span class="kiosk-machine-tag">3단계 · 승차권 종류</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<h2 class="step-heading">승차권 종류를 선택해 주세요</h2>' +
              '<p class="step-sub">선택하신 역(' + escapeHtml(station ? station.name : '') + ') 기준 1매당 연습용 요금입니다.</p>' +
              '<div class="choice-grid-3">' +
                SUBWAY_TICKET_TYPES.map(function (tt) {
                  const sel = subwayState.ticketTypeId === tt.id ? 'selected' : '';
                  const fare = getSubwayUnitFare(station, tt);
                  return (
                    '<button type="button" class="choice-card ' + sel + '" data-subway-type="' + tt.id + '" style="min-height:190px;">' +
                      '<span class="choice-title">' + escapeHtml(tt.name) + '</span>' +
                      '<span class="choice-sub">' + escapeHtml(tt.desc) + '</span>' +
                      '<span class="choice-price" style="font-size:1.35rem;">1매 ' + formatWon(fare) + '</span>' +
                    '</button>'
                  );
                }).join('') +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }

      if (s === 3) {
        const unitFare = getSubwayUnitFare(station, ticketType);
        const totalFare = getSubwayTotalFare();
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-subway">' +
              '<div class="kiosk-machine-brand">지하철 무인 발매기 · 수량 선택</div>' +
              '<span class="kiosk-machine-tag">4단계 · 매수 정하기</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<h2 class="step-heading">승차권을 몇 매 구매하시겠어요?</h2>' +
              '<p class="step-sub">인원수에 맞게 + 와 - 버튼을 눌러 수량을 정해 주세요.</p>' +
              '<div class="summary-box" style="margin-bottom:20px;">' +
                '<div class="summary-row"><span class="summary-label">목적지</span><span class="summary-val">' + escapeHtml(station ? station.name : '') + '</span></div>' +
                '<div class="summary-row"><span class="summary-label">승차권 종류</span><span class="summary-val">' + escapeHtml(ticketType ? ticketType.name : '') + '</span></div>' +
                '<div class="summary-row"><span class="summary-label">1매 연습 요금</span><span class="summary-val">' + formatWon(unitFare) + '</span></div>' +
              '</div>' +
              '<div class="qty-box">' +
                '<button type="button" class="qty-btn" id="subwayQtyMinus" aria-label="매수 1 줄이기" ' + (subwayState.qty <= 1 ? 'disabled' : '') + '>−</button>' +
                '<span class="qty-value">' + subwayState.qty + '매</span>' +
                '<button type="button" class="qty-btn" id="subwayQtyPlus" aria-label="매수 1 늘리기" ' + (subwayState.qty >= 9 ? 'disabled' : '') + '>+</button>' +
              '</div>' +
              '<div class="total-price-bar">' +
                '<span class="total-price-label">총 연습 요금 (' + subwayState.qty + '매)</span>' +
                '<span class="total-price-amount">' + formatWon(totalFare) + '</span>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }

      if (s === 4) {
        const totalFare = getSubwayTotalFare();
        return (
          '<div class="kiosk-screen-frame">' +
            '<div class="kiosk-machine-header theme-subway">' +
              '<div class="kiosk-machine-brand">지하철 무인 발매기 · 요금 확인</div>' +
              '<span class="kiosk-machine-tag">5단계 · 요금 및 결제 선택</span>' +
            '</div>' +
            '<div class="kiosk-screen-body">' +
              '<h2 class="step-heading">1) 선택한 승차권 정보를 확인해 주세요</h2>' +
              '<div class="summary-box" style="margin-bottom:18px;">' +
                '<div class="summary-row"><span class="summary-label">출발역</span><span class="summary-val">연습용 출발역</span></div>' +
                '<div class="summary-row">' +
                  '<span class="summary-label">목적지 역</span>' +
                  '<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">' +
                    '<span class="summary-val">' + escapeHtml(station ? station.name : '') + '</span>' +
                    '<button type="button" class="btn btn-secondary" style="min-height:44px; padding:6px 14px;" data-subway-edit="1">수정</button>' +
                  '</div>' +
                '</div>' +
                '<div class="summary-row">' +
                  '<span class="summary-label">승차권 종류</span>' +
                  '<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">' +
                    '<span class="summary-val">' + escapeHtml(ticketType ? ticketType.name : '') + '</span>' +
                    '<button type="button" class="btn btn-secondary" style="min-height:44px; padding:6px 14px;" data-subway-edit="2">수정</button>' +
                  '</div>' +
                '</div>' +
                '<div class="summary-row">' +
                  '<span class="summary-label">승차권 수량</span>' +
                  '<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">' +
                    '<span class="summary-val">' + subwayState.qty + '매</span>' +
                    '<button type="button" class="btn btn-secondary" style="min-height:44px; padding:6px 14px;" data-subway-edit="3">수정</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +

              '<div class="total-price-bar" style="margin-bottom:24px;">' +
                '<span class="total-price-label">총 연습 결제 요금</span>' +
                '<span class="total-price-amount">' + formatWon(totalFare) + '</span>' +
              '</div>' +

              '<h2 class="step-heading">2) 결제 방법을 선택해 주세요</h2>' +
              '<div class="choice-grid-2">' +
                '<button type="button" class="choice-card ' + (subwayState.paymentMethod === 'card' ? 'selected' : '') + '" data-subway-pay="card" style="min-height:175px;">' +
                  '<svg width="74" height="54" viewBox="0 0 74 54" fill="none" aria-hidden="true">' +
                    '<rect x="3" y="4" width="68" height="46" rx="8" fill="#2458A6"/>' +
                    '<rect x="3" y="14" width="68" height="8" fill="#172B4D"/>' +
                    '<rect x="12" y="29" width="16" height="11" rx="2.5" fill="#F5CF69"/>' +
                  '</svg>' +
                  '<span class="choice-title">신용·체크카드 결제</span>' +
                  '<span class="choice-sub">가상 카드 투입으로 결제 연습 (추천)</span>' +
                '</button>' +
                '<button type="button" class="choice-card ' + (subwayState.paymentMethod === 'mobile' ? 'selected' : '') + '" data-subway-pay="mobile" style="min-height:175px;">' +
                  '<svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">' +
                    '<rect x="18" y="6" width="28" height="52" rx="6" fill="#DCEBFC" stroke="#2458A6" stroke-width="3"/>' +
                    '<rect x="24" y="18" width="16" height="22" rx="2" fill="#2458A6"/>' +
                    '<circle cx="32" cy="49" r="2.5" fill="#2458A6"/>' +
                  '</svg>' +
                  '<span class="choice-title">모바일 간편결제</span>' +
                  '<span class="choice-sub">휴대폰 바코드 결제 연습</span>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }

      if (s === 5) {
        return renderCardPaymentStep({
          themeClass: 'theme-subway',
          brandName: '지하철 무인 승차권 발매기',
          totalAmount: getSubwayTotalFare(),
          paymentMethod: subwayState.paymentMethod,
          cardInserted: subwayState.cardInserted,
          completeButtonLabel: '연습용 승차권 발급받기 →'
        });
      }

      // Step 6: Completion
      const totalFare = getSubwayTotalFare();
      return (
        '<div class="result-hero">' +
          '<div class="result-check-circle" aria-hidden="true">' +
            '<svg width="40" height="40" viewBox="0 0 24 24" fill="none">' +
              '<path d="M5 13L9.5 17.5L19 7" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>' +
          '</div>' +
          '<h2 class="result-title">승차권 구매 연습이 완료되었습니다!</h2>' +
          '<p class="result-subtitle">실제 승차권 발급과 결제는 이루어지지 않았습니다. 정말 잘 하셨어요!</p>' +
        '</div>' +

        '<div class="subway-ticket-card" aria-label="연습용 승차권">' +
          '<div class="subway-ticket-top">' +
            '<span>연습용 지하철 승차권</span>' +
            '<span>' + escapeHtml(subwayState.ticketCode) + '</span>' +
          '</div>' +
          '<div class="subway-ticket-body">' +
            '<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:14px;">' +
              '<div>' +
                '<div style="font-size:0.82rem; color:var(--text-sub); font-weight:800;">출발역</div>' +
                '<div style="font-size:1.15rem; font-weight:900;">연습용 출발역</div>' +
              '</div>' +
              '<div style="font-size:1.5rem; font-weight:900; color:var(--royal-blue);" aria-hidden="true">→</div>' +
              '<div style="text-align:right;">' +
                '<div style="font-size:0.82rem; color:var(--text-sub); font-weight:800;">목적지</div>' +
                '<div style="font-size:1.25rem; font-weight:900; color:var(--royal-blue);">' + escapeHtml(station ? station.name : '') + '</div>' +
              '</div>' +
            '</div>' +
            '<div style="border-top:2px dashed var(--sky-blue); padding-top:12px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; font-weight:800;">' +
              '<span>' + escapeHtml(ticketType ? ticketType.name : '') + ' · ' + subwayState.qty + '매</span>' +
              '<span style="color:var(--royal-blue); font-size:1.25rem;">' + formatWon(totalFare) + '</span>' +
            '</div>' +
            '<div style="margin-top:12px; background:var(--yellow-bg); border:1.5px solid var(--yellow-border); border-radius:10px; padding:8px 12px; font-size:0.82rem; font-weight:800; text-align:center;">' +
              '교육용 가상 승차권 · 실제 탑승에는 사용할 수 없습니다' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<h3 style="margin:0 0 14px; font-size:1.25rem; color:var(--royal-blue);">발급 내역 요약</h3>' +
          '<div class="summary-box">' +
            '<div class="summary-row"><span class="summary-label">목적지</span><span class="summary-val">' + escapeHtml(station ? station.name : '') + '</span></div>' +
            '<div class="summary-row"><span class="summary-label">승차권 종류</span><span class="summary-val">' + escapeHtml(ticketType ? ticketType.name : '') + '</span></div>' +
            '<div class="summary-row"><span class="summary-label">승차권 수량</span><span class="summary-val">' + subwayState.qty + '매</span></div>' +
            '<div class="summary-row"><span class="summary-label">결제 방법</span><span class="summary-val">' + (subwayState.paymentMethod === 'card' ? '신용·체크카드 (연습용)' : '모바일 간편결제 (연습용)') + '</span></div>' +
          '</div>' +
          '<div class="total-price-bar">' +
            '<span class="total-price-label">총 연습 결제 금액</span>' +
            '<span class="total-price-amount">' + formatWon(totalFare) + '</span>' +
          '</div>' +
        '</div>' +
        renderResultFooterButtons('subway')
      );
    },
    bindEvents: function (container) {
      const startBtn = container.querySelector('#subwayStartBtn');
      if (startBtn) {
        startBtn.addEventListener('click', function () {
          subwayState.startedPurchase = true;
          subwayState.step = 1;
          renderActiveKiosk();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
      container.querySelectorAll('[data-subway-station]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          subwayState.stationId = btn.dataset.subwayStation;
          renderActiveKiosk();
        });
      });
      container.querySelectorAll('[data-subway-type]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          subwayState.ticketTypeId = btn.dataset.subwayType;
          renderActiveKiosk();
        });
      });
      const qtyMinus = container.querySelector('#subwayQtyMinus');
      const qtyPlus = container.querySelector('#subwayQtyPlus');
      if (qtyMinus) {
        qtyMinus.addEventListener('click', function () {
          if (subwayState.qty > 1) {
            subwayState.qty -= 1;
            renderActiveKiosk();
          }
        });
      }
      if (qtyPlus) {
        qtyPlus.addEventListener('click', function () {
          if (subwayState.qty < 9) {
            subwayState.qty += 1;
            renderActiveKiosk();
          }
        });
      }
      container.querySelectorAll('[data-subway-edit]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          subwayState.step = Number(btn.dataset.subwayEdit);
          renderActiveKiosk();
        });
      });
      container.querySelectorAll('[data-subway-pay]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          subwayState.paymentMethod = btn.dataset.subwayPay;
          renderActiveKiosk();
        });
      });
      const insertBtn = container.querySelector('#virtualCardInsertBtn');
      if (insertBtn) {
        insertBtn.addEventListener('click', function () {
          subwayState.cardInserted = true;
          renderActiveKiosk();
        });
      }
      const completeBtn = container.querySelector('#virtualCardCompleteBtn');
      if (completeBtn) {
        completeBtn.addEventListener('click', function () {
          subwayState.ticketCode = randomOrderCode('T');
          subwayState.step = 6;
          renderActiveKiosk();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
      bindResultFooterButtons(container);
    }
  };

  // Shared helper for rendering standard completion footer buttons
  function renderResultFooterButtons(currentKey) {
    const others = [
      { key: 'cafe', label: '카페 주문 연습' },
      { key: 'restaurant', label: '음식점 주문 연습' },
      { key: 'hospital', label: '병원 접수 연습' },
      { key: 'subway', label: '승차권 구매 연습' }
    ].filter(function (item) { return item.key !== currentKey; });

    return (
      '<div class="card" style="margin-top: 20px;">' +
        '<div style="font-weight: 800; margin-bottom: 14px; color: var(--royal-blue);">다음에 무엇을 해 보실까요?</div>' +
        '<div class="result-actions" style="margin-top: 0;">' +
          '<button type="button" class="btn btn-primary" data-result-retry>다시 연습하기</button>' +
          '<button type="button" class="btn btn-secondary" data-result-other-toggle>다른 체험 선택하기</button>' +
          '<button type="button" class="btn btn-outline" data-result-home>홈으로 돌아가기</button>' +
        '</div>' +
        '<div id="otherKioskChooser" style="display:none; margin-top: 16px; padding-top: 16px; border-top: 2px dashed var(--border);">' +
          '<div style="font-weight: 800; margin-bottom: 12px;">연습할 다른 키오스크를 골라 주세요.</div>' +
          '<div class="choice-grid-3">' +
            others.map(function (o) {
              return '<button type="button" class="btn btn-outline" data-switch-kiosk="' + o.key + '">' + o.label + '</button>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function bindResultFooterButtons(container) {
    const retryBtn = container.querySelector('[data-result-retry]');
    if (retryBtn) {
      retryBtn.addEventListener('click', function () {
        startKiosk(currentKioskKey);
      });
    }
    const homeBtn = container.querySelector('[data-result-home]');
    if (homeBtn) {
      homeBtn.addEventListener('click', function () {
        showView('home');
      });
    }
    const toggleBtn = container.querySelector('[data-result-other-toggle]');
    const chooser = container.querySelector('#otherKioskChooser');
    if (toggleBtn && chooser) {
      toggleBtn.addEventListener('click', function () {
        chooser.style.display = chooser.style.display === 'none' ? 'block' : 'none';
      });
    }
    container.querySelectorAll('[data-switch-kiosk]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        startKiosk(btn.dataset.switchKiosk);
      });
    });
  }

  // Initialize default font size
  applyFontSize(1);
})();
