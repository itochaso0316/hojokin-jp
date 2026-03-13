// ========================
// 補助金申請ナビゲーター JavaScript
// ========================

class SubsidyNavigator {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.formData = {
            subsidy: null,
            companyInfo: {},
            businessPlan: {},
            bonusItems: {}
        };

        this.subsidies = [
            {
                id: 'small-biz-subsidy',
                name: '小規模事業者持続化補助金',
                description: '小規模事業者向けの販売促進・生産性向上を支援する補助金',
                maxAmount: 50,
                rate: 0.75
            },
            {
                id: 'business-expansion',
                name: 'ものづくり補助金',
                description: '革新的な製造技術・製品開発を支援する補助金',
                maxAmount: 500,
                rate: 0.5
            },
            {
                id: 'digital-transform',
                name: 'デジタル化支援事業',
                description: 'DX推進によるビジネス変革を支援する補助金',
                maxAmount: 1000,
                rate: 0.5
            },
            {
                id: 'green-business',
                name: 'グリーン成長戦略推進事業',
                description: 'カーボンニュートラル達成への投資を支援する補助金',
                maxAmount: 2000,
                rate: 0.33
            },
            {
                id: 'startup-fund',
                name: 'スタートアップ支援補助金',
                description: '革新的なビジネスを展開する新規開業者向け補助金',
                maxAmount: 200,
                rate: 0.75
            }
        ];

        this.questions = {
            1: [
                {
                    id: 'subsidy-select',
                    type: 'subsidy-select',
                    question: 'どの補助金に申請したいですか？',
                    hint: 'あなたの事業に最も適した補助金を選択してください。各補助金の詳細は説明をご覧ください。',
                    required: true
                }
            ],
            2: [
                {
                    id: 'company-name',
                    type: 'text',
                    question: '事業者名または法人名を入力してください',
                    placeholder: '例：〇〇会社',
                    required: true
                },
                {
                    id: 'company-type',
                    type: 'radio',
                    question: '組織形態を選択してください',
                    options: [
                        { value: 'corporation', label: '株式会社' },
                        { value: 'llc', label: '合同会社' },
                        { value: 'sole-proprietor', label: '個人事業主' },
                        { value: 'nonprofit', label: 'NPO法人' },
                        { value: 'cooperative', label: '協同組合' },
                        { value: 'other', label: 'その他' }
                    ],
                    required: true
                },
                {
                    id: 'employees',
                    type: 'radio',
                    question: '従業員数を選択してください',
                    options: [
                        { value: '1-5', label: '1～5名' },
                        { value: '6-20', label: '6～20名' },
                        { value: '21-50', label: '21～50名' },
                        { value: '51-100', label: '51～100名' },
                        { value: '101+', label: '101名以上' }
                    ],
                    required: true
                },
                {
                    id: 'industry',
                    type: 'select',
                    question: '業種を選択してください',
                    options: [
                        { value: '', label: '選択してください' },
                        { value: 'manufacturing', label: '製造業' },
                        { value: 'construction', label: '建設業' },
                        { value: 'service', label: 'サービス業' },
                        { value: 'retail', label: '卸売・小売業' },
                        { value: 'it', label: 'IT・情報通信' },
                        { value: 'healthcare', label: '医療・福祉' },
                        { value: 'education', label: '教育・訓練' },
                        { value: 'agriculture', label: '農業・漁業' },
                        { value: 'other', label: 'その他' }
                    ],
                    required: true
                },
                {
                    id: 'establishment-year',
                    type: 'text',
                    question: '設立年または開業年を入力してください（西暦）',
                    placeholder: '例：2015',
                    inputType: 'number',
                    required: true
                },
                {
                    id: 'location',
                    type: 'text',
                    question: '事業所の所在地（都道府県と市区町村）を入力してください',
                    placeholder: '例：東京都渋谷区',
                    required: true
                }
            ],
            3: [
                {
                    id: 'business-summary',
                    type: 'textarea',
                    question: '事業内容を簡潔に説明してください',
                    placeholder: '現在の事業内容、提供する製品やサービスについて100～200文字程度で説明してください',
                    hint: '取り扱う製品・サービス、主な顧客層などを含めてください',
                    required: true
                },
                {
                    id: 'project-title',
                    type: 'text',
                    question: 'プロジェクト名を入力してください',
                    placeholder: '例：新商品開発プロジェクト',
                    required: true
                },
                {
                    id: 'project-description',
                    type: 'textarea',
                    question: 'プロジェクトの内容と目的を説明してください',
                    placeholder: '補助金を使用して実施するプロジェクトについて、具体的な内容と達成目標を200～300文字程度で説明してください',
                    hint: 'どのような課題を解決し、どのような成果を期待しているかを明確に述べてください',
                    required: true
                },
                {
                    id: 'investment-amount',
                    type: 'text',
                    question: '総事業費を入力してください（万円）',
                    placeholder: '例：500',
                    inputType: 'number',
                    hint: '補助対象経費の合計額を入力してください',
                    required: true
                },
                {
                    id: 'implementation-period',
                    type: 'radio',
                    question: '事業実施期間を選択してください',
                    options: [
                        { value: '6months', label: '6ヶ月以内' },
                        { value: '1year', label: '1年以内' },
                        { value: '2years', label: '2年以内' },
                        { value: '3years', label: '3年以内' }
                    ],
                    required: true
                }
            ],
            4: [
                {
                    id: 'innovation-level',
                    type: 'radio',
                    question: 'この事業計画の革新性について選択してください',
                    options: [
                        { value: 'highly-innovative', label: '非常に革新的（新しい技術・モデルの導入）' },
                        { value: 'innovative', label: 'やや革新的（既存事業の大きな改善）' },
                        { value: 'standard', label: '標準的（通常の事業改善）' }
                    ],
                    required: true
                },
                {
                    id: 'sustainability',
                    type: 'checkbox',
                    question: '以下の持続可能性要素にチェックしてください（複数選択可）',
                    options: [
                        { value: 'carbon-neutral', label: 'カーボンニュートラル達成に貢献' },
                        { value: 'circular-economy', label: 'サーキュラーエコノミーの実践' },
                        { value: 'energy-efficient', label: 'エネルギー効率化' },
                        { value: 'water-conservation', label: '水資源の節約' },
                        { value: 'waste-reduction', label: '廃棄物削減' }
                    ],
                    required: false
                },
                {
                    id: 'digital-adoption',
                    type: 'checkbox',
                    question: 'デジタル化への取組にチェックしてください（複数選択可）',
                    options: [
                        { value: 'ai-ml', label: 'AI・機械学習の活用' },
                        { value: 'cloud', label: 'クラウドサービスの導入' },
                        { value: 'iot', label: 'IoT・センサー技術の活用' },
                        { value: 'blockchain', label: 'ブロックチェーン技術の活用' },
                        { value: 'automation', label: '業務自動化' }
                    ],
                    required: false
                },
                {
                    id: 'regional-impact',
                    type: 'checkbox',
                    question: '地域への貢献にチェックしてください（複数選択可）',
                    options: [
                        { value: 'job-creation', label: '雇用創出' },
                        { value: 'local-procurement', label: '地域資源の活用' },
                        { value: 'community-development', label: 'コミュニティ発展への貢献' },
                        { value: 'rural-development', label: '過疎地域の活性化' },
                        { value: 'tourism', label: '観光産業の振興' }
                    ],
                    required: false
                },
                {
                    id: 'workforce-development',
                    type: 'radio',
                    question: '人材育成への投資計画について選択してください',
                    options: [
                        { value: 'significant', label: '重要（従業員研修に予算配分）' },
                        { value: 'moderate', label: '中程度（部分的な育成計画あり）' },
                        { value: 'minimal', label: '最小限（現在のところ予定なし）' }
                    ],
                    required: true
                }
            ],
            5: [
                {
                    id: 'schedule-confirm',
                    type: 'radio',
                    question: 'プロジェクトスケジュールに同意しますか？',
                    options: [
                        { value: 'yes', label: 'はい、このスケジュールで進めます' },
                        { value: 'no', label: 'いいえ、前のステップに戻ります' }
                    ],
                    required: true
                }
            ]
        };

        this.currentQuestionIndex = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderStep();
    }

    setupEventListeners() {
        document.getElementById('btn-next').addEventListener('click', () => this.nextStep());
        document.getElementById('btn-prev').addEventListener('click', () => this.prevStep());
        window.addEventListener('resize', () => this.handleResize());
    }

    renderStep() {
        const chatContainer = document.getElementById('chat-container');
        const inputArea = document.getElementById('input-area');

        // Clear previous content
        chatContainer.innerHTML = '';
        inputArea.innerHTML = '';

        if (this.currentStep <= 4) {
            this.renderFormStep();
        } else {
            this.renderPreviewStep();
        }

        this.updateProgress();
    }

    renderFormStep() {
        const chatContainer = document.getElementById('chat-container');
        const inputArea = document.getElementById('input-area');

        const stepQuestions = this.questions[this.currentStep];
        const question = stepQuestions[this.currentQuestionIndex];

        // Add bot greeting
        if (this.currentQuestionIndex === 0) {
            this.addBotMessage(this.getStepGreeting());
        }

        // Add question
        this.addBotMessage(question.question, question.hint);

        // Render input based on type
        this.renderInput(question);
    }

    renderInput(question) {
        const inputArea = document.getElementById('input-area');
        const wrapper = document.createElement('div');
        wrapper.className = 'input-wrapper';
        wrapper.id = `input-${question.id}`;

        let inputHTML = '';

        switch (question.type) {
            case 'text':
                inputHTML = `
                    <input type="text"
                        class="text-input"
                        id="${question.id}"
                        placeholder="${question.placeholder || ''}"
                        data-question-id="${question.id}"
                        autocomplete="off">
                `;
                break;

            case 'textarea':
                inputHTML = `
                    <textarea class="text-input"
                        id="${question.id}"
                        placeholder="${question.placeholder || ''}"
                        data-question-id="${question.id}"
                        rows="4"></textarea>
                `;
                break;

            case 'select':
                inputHTML = `<select class="select-input" id="${question.id}" data-question-id="${question.id}">`;
                question.options.forEach(opt => {
                    inputHTML += `<option value="${opt.value}">${opt.label}</option>`;
                });
                inputHTML += `</select>`;
                break;

            case 'radio':
                inputHTML = '<div class="radio-group">';
                question.options.forEach(opt => {
                    const uniqueId = `${question.id}-${opt.value}`;
                    inputHTML += `
                        <label class="radio-item">
                            <input type="radio" name="${question.id}" value="${opt.value}" id="${uniqueId}">
                            <span class="radio-label">${opt.label}</span>
                        </label>
                    `;
                });
                inputHTML += '</div>';
                break;

            case 'checkbox':
                inputHTML = '<div class="checkbox-group">';
                question.options.forEach(opt => {
                    const uniqueId = `${question.id}-${opt.value}`;
                    inputHTML += `
                        <label class="checkbox-item">
                            <input type="checkbox" name="${question.id}" value="${opt.value}" id="${uniqueId}">
                            <span class="checkbox-label">${opt.label}</span>
                        </label>
                    `;
                });
                inputHTML += '</div>';
                break;

            case 'subsidy-select':
                inputHTML = '<div class="subsidy-select-group">';
                this.subsidies.forEach(subsidy => {
                    inputHTML += `
                        <div class="subsidy-option" data-subsidy-id="${subsidy.id}">
                            <div class="subsidy-name">${subsidy.name}</div>
                            <div class="subsidy-desc">${subsidy.description}</div>
                            <div class="subsidy-info" style="margin-top: 0.5rem; font-size: 0.8rem; color: #64748b;">
                                <span>上限額：${subsidy.maxAmount}万円</span> |
                                <span>補助率：${(subsidy.rate * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    `;
                });
                inputHTML += '</div>';
                break;
        }

        wrapper.innerHTML = inputHTML;

        // Add help text if provided
        if (question.hint) {
            const helpText = document.createElement('div');
            helpText.className = 'help-text';
            helpText.textContent = question.hint;
            wrapper.appendChild(helpText);
        }

        inputArea.appendChild(wrapper);

        // Add event listeners
        if (question.type === 'subsidy-select') {
            document.querySelectorAll('.subsidy-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    document.querySelectorAll('.subsidy-option').forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                    const subsidyId = option.dataset.subsidyId;
                    this.formData.subsidy = subsidyId;
                });
            });
        }

        // Focus first input
        const firstInput = wrapper.querySelector('input, textarea, select, .subsidy-option');
        if (firstInput && question.type !== 'subsidy-select') {
            firstInput.focus();
        }
    }

    addBotMessage(message, hint = null) {
        const chatContainer = document.getElementById('chat-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';

        let content = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="message-bubble">${this.escapeHtml(message)}</div>
        `;

        if (hint) {
            content += `<div class="message-bubble" style="background: #f0f7ff; border-color: #bfdbfe; color: #1e40af; margin-top: 0.5rem; font-size: 0.875rem;">💡 ${this.escapeHtml(hint)}</div>`;
        }

        content += `</div>`;
        messageDiv.innerHTML = content;
        chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addUserMessage(message) {
        const chatContainer = document.getElementById('chat-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-bubble">${this.escapeHtml(message)}</div>
            </div>
            <div class="message-avatar">👤</div>
        `;
        chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    getStepGreeting() {
        const greetings = {
            1: 'こんにちは！補助金申請ナビゲーターへようこそ。📋\n\nまず、あなたが申請したい補助金を選択してください。あなたの事業に最も適した補助金を見つけるお手伝いをさせていただきます。',
            2: 'ありがとうございます。次に、あなたの事業についての基本情報をお聞きします。📊\n\nこの情報は補助金の適正な評価に重要です。正確にご入力ください。',
            3: 'では、実施予定のプロジェクトについて詳しくお伺いします。💼\n\nプロジェクトの具体的な内容と期待される成果をご説明ください。',
            4: 'プロジェクトの詳細をありがとうございます。最後に、事業計画の強みについてお聞きします。⭐\n\nあなたのプロジェクトの特徴と付加価値を確認させていただきます。',
            5: 'ご入力ありがとうございます。事業計画書の草案を作成させていただきました。📝\n\n以下が生成された計画書の概要です。ご確認ください。'
        };
        return greetings[this.currentStep] || '次へお進みください。';
    }

    nextStep() {
        const currentStepQuestions = this.questions[this.currentStep];

        if (this.currentQuestionIndex < currentStepQuestions.length - 1) {
            // Move to next question in current step
            const userAnswer = this.captureUserInput();
            if (userAnswer !== null) {
                this.addUserMessage(userAnswer);
                this.currentQuestionIndex++;
                this.renderFormStep();
            }
        } else {
            // Move to next step
            const userAnswer = this.captureUserInput();
            if (userAnswer !== null) {
                this.addUserMessage(userAnswer);

                if (this.currentStep < this.totalSteps) {
                    this.currentStep++;
                    this.currentQuestionIndex = 0;
                    this.renderStep();
                } else {
                    this.completeNavigator();
                }
            }
        }
    }

    prevStep() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderFormStep();
        } else if (this.currentStep > 1) {
            this.currentStep--;
            this.currentQuestionIndex = this.questions[this.currentStep].length - 1;
            this.renderStep();
        }
    }

    captureUserInput() {
        const currentStepQuestions = this.questions[this.currentStep];
        const question = currentStepQuestions[this.currentQuestionIndex];

        let value = null;
        let displayValue = '';

        switch (question.type) {
            case 'text':
            case 'textarea':
                const input = document.getElementById(question.id);
                value = input.value.trim();
                displayValue = value;
                if (question.required && !value) {
                    alert('この項目は必須です。入力してください。');
                    input.focus();
                    return null;
                }
                break;

            case 'select':
                const select = document.getElementById(question.id);
                value = select.value;
                displayValue = select.options[select.selectedIndex].text;
                if (question.required && !value) {
                    alert('この項目は必須です。選択してください。');
                    select.focus();
                    return null;
                }
                break;

            case 'radio':
                const checked = document.querySelector(`input[name="${question.id}"]:checked`);
                if (!checked) {
                    alert('この項目は必須です。選択してください。');
                    return null;
                }
                value = checked.value;
                displayValue = checked.nextElementSibling.textContent.trim();
                break;

            case 'checkbox':
                const checkedBoxes = document.querySelectorAll(`input[name="${question.id}"]:checked`);
                if (question.required && checkedBoxes.length === 0) {
                    alert('この項目は必須です。最低1つ選択してください。');
                    return null;
                }
                value = Array.from(checkedBoxes).map(cb => cb.value);
                displayValue = Array.from(checkedBoxes).map(cb => cb.nextElementSibling.textContent.trim()).join('、');
                break;

            case 'subsidy-select':
                if (!this.formData.subsidy) {
                    alert('補助金を選択してください。');
                    return null;
                }
                const subsidyData = this.subsidies.find(s => s.id === this.formData.subsidy);
                value = this.formData.subsidy;
                displayValue = subsidyData.name;
                break;
        }

        // Store in formData
        if (this.currentStep === 1) {
            this.formData.subsidy = value;
        } else if (this.currentStep === 2) {
            this.formData.companyInfo[question.id] = value;
        } else if (this.currentStep === 3) {
            this.formData.businessPlan[question.id] = value;
        } else if (this.currentStep === 4) {
            this.formData.bonusItems[question.id] = value;
        }

        return displayValue;
    }

    renderPreviewStep() {
        const chatContainer = document.getElementById('chat-container');
        const inputArea = document.getElementById('input-area');

        // Add greeting message
        this.addBotMessage(this.getStepGreeting());

        // Generate preview
        const previewHTML = this.generatePreview();
        chatContainer.innerHTML += previewHTML;

        // Render final action buttons
        inputArea.innerHTML = `
            <div style="text-align: center; gap: 1rem; display: flex; justify-content: center;">
                <button class="btn btn-secondary" onclick="location.href='../index.html'">キャンセル</button>
                <button class="btn btn-primary" onclick="navigator.downloadPlan()">📥 計画書をダウンロード</button>
                <button class="btn btn-primary" onclick="window.print()">🖨️ 印刷する</button>
            </div>
        `;

        this.scrollToBottom();
    }

    generatePreview() {
        const subsidyData = this.subsidies.find(s => s.id === this.formData.subsidy);
        const companyInfo = this.formData.companyInfo;
        const businessPlan = this.formData.businessPlan;
        const bonusItems = this.formData.bonusItems;

        const html = `
            <div class="preview-container">
                <div class="preview-header">
                    <div>
                        <div class="preview-title">事業計画書（案）</div>
                        <div style="font-size: 0.9rem; color: #64748b; margin-top: 0.5rem;">
                            ${subsidyData.name} 申請用
                        </div>
                    </div>
                </div>

                <div class="success-badge">
                    ✓ すべての項目が入力されました。以下のプレビューをご確認ください。
                </div>

                <!-- 申請概要セクション -->
                <div class="preview-section">
                    <div class="preview-section-title">📋 申請概要</div>
                    <div class="preview-row">
                        <div class="preview-item">
                            <div class="preview-item-label">補助金制度</div>
                            <div class="preview-item-value">${subsidyData.name}</div>
                        </div>
                        <div class="preview-item">
                            <div class="preview-item-label">上限補助額</div>
                            <div class="preview-item-value">${subsidyData.maxAmount}万円 (${(subsidyData.rate * 100).toFixed(0)}%)</div>
                        </div>
                    </div>
                </div>

                <!-- 会社情報セクション -->
                <div class="preview-section">
                    <div class="preview-section-title">🏢 事業者情報</div>
                    <div class="preview-row">
                        <div class="preview-item">
                            <div class="preview-item-label">事業者名</div>
                            <div class="preview-item-value">${this.escapeHtml(companyInfo['company-name'] || '-')}</div>
                        </div>
                        <div class="preview-item">
                            <div class="preview-item-label">組織形態</div>
                            <div class="preview-item-value">${this.formatLabel(companyInfo['company-type'])}</div>
                        </div>
                    </div>
                    <div class="preview-row">
                        <div class="preview-item">
                            <div class="preview-item-label">従業員数</div>
                            <div class="preview-item-value">${companyInfo['employees'] || '-'}</div>
                        </div>
                        <div class="preview-item">
                            <div class="preview-item-label">業種</div>
                            <div class="preview-item-value">${this.formatLabel(companyInfo['industry'])}</div>
                        </div>
                    </div>
                    <div class="preview-row">
                        <div class="preview-item">
                            <div class="preview-item-label">設立年</div>
                            <div class="preview-item-value">${companyInfo['establishment-year'] || '-'}</div>
                        </div>
                        <div class="preview-item">
                            <div class="preview-item-label">事業所所在地</div>
                            <div class="preview-item-value">${this.escapeHtml(companyInfo['location'] || '-')}</div>
                        </div>
                    </div>
                </div>

                <!-- 事業計画セクション -->
                <div class="preview-section">
                    <div class="preview-section-title">📊 事業計画の概要</div>
                    <div class="preview-item" style="margin-bottom: 1rem;">
                        <div class="preview-item-label">現在の事業内容</div>
                        <div class="preview-item-value">${this.escapeHtml(businessPlan['business-summary'] || '-')}</div>
                    </div>
                    <div class="preview-item" style="margin-bottom: 1rem;">
                        <div class="preview-item-label">プロジェクト名</div>
                        <div class="preview-item-value">${this.escapeHtml(businessPlan['project-title'] || '-')}</div>
                    </div>
                    <div class="preview-item" style="margin-bottom: 1rem;">
                        <div class="preview-item-label">プロジェクト内容と目的</div>
                        <div class="preview-item-value">${this.escapeHtml(businessPlan['project-description'] || '-')}</div>
                    </div>
                    <div class="preview-row">
                        <div class="preview-item">
                            <div class="preview-item-label">総事業費</div>
                            <div class="preview-item-value">${businessPlan['investment-amount'] || '-'}万円</div>
                        </div>
                        <div class="preview-item">
                            <div class="preview-item-label">実施期間</div>
                            <div class="preview-item-value">${this.formatLabel(businessPlan['implementation-period'])}</div>
                        </div>
                    </div>
                </div>

                <!-- 加点項目セクション -->
                <div class="preview-section">
                    <div class="preview-section-title">⭐ 加点項目</div>
                    <div class="preview-item" style="margin-bottom: 1rem;">
                        <div class="preview-item-label">革新性レベル</div>
                        <div class="preview-item-value">${this.formatLabel(bonusItems['innovation-level'])}</div>
                    </div>
                    ${bonusItems['sustainability'] && bonusItems['sustainability'].length > 0 ? `
                    <div class="preview-item" style="margin-bottom: 1rem;">
                        <div class="preview-item-label">持続可能性への貢献</div>
                        <div class="preview-item-value">${bonusItems['sustainability'].map(s => this.formatLabel(s)).join('、')}</div>
                    </div>
                    ` : ''}
                    ${bonusItems['digital-adoption'] && bonusItems['digital-adoption'].length > 0 ? `
                    <div class="preview-item" style="margin-bottom: 1rem;">
                        <div class="preview-item-label">デジタル化への取組</div>
                        <div class="preview-item-value">${bonusItems['digital-adoption'].map(s => this.formatLabel(s)).join('、')}</div>
                    </div>
                    ` : ''}
                    ${bonusItems['regional-impact'] && bonusItems['regional-impact'].length > 0 ? `
                    <div class="preview-item" style="margin-bottom: 1rem;">
                        <div class="preview-item-label">地域への貢献</div>
                        <div class="preview-item-value">${bonusItems['regional-impact'].map(s => this.formatLabel(s)).join('、')}</div>
                    </div>
                    ` : ''}
                    <div class="preview-item" style="margin-bottom: 1rem;">
                        <div class="preview-item-label">人材育成への投資</div>
                        <div class="preview-item-value">${this.formatLabel(bonusItems['workforce-development'])}</div>
                    </div>
                </div>

                <!-- 次のステップセクション -->
                <div class="preview-section" style="background: #f0f7ff; border-radius: 0.75rem; padding: 1.5rem; border: 1px solid #bfdbfe;">
                    <div class="preview-section-title" style="color: #1e40af; border-bottom-color: #bfdbfe;">📌 次のステップ</div>
                    <ol style="margin-left: 1.5rem; line-height: 1.8; color: #1e40af;">
                        <li>以下の計画書をダウンロード・印刷してください</li>
                        <li>不足する添付資料（決算書、営業許可証など）を準備してください</li>
                        <li>事務局に申請書類一式を提出してください</li>
                        <li>事務局からの連絡を待ってください（審査期間：約3ヶ月）</li>
                    </ol>
                </div>

                <div class="preview-section" style="background: #fef3c7; border-radius: 0.75rem; padding: 1.5rem; border: 1px solid #fbbf24;">
                    <div style="font-weight: 600; color: #92400e; margin-bottom: 0.75rem;">⚠️ 重要な注意事項</div>
                    <ul style="margin-left: 1.5rem; line-height: 1.8; color: #92400e; font-size: 0.95rem;">
                        <li>この計画書は申請用の参考資料です。最終的な申請書類は公式フォーマットを使用してください</li>
                        <li>内容は実績に基づき、実現可能性の高いものとしてください</li>
                        <li>補助金の交付は申請内容が補助対象経費に該当することが条件となります</li>
                        <li>詳しくは<a href="../index.html" style="color: #92400e; text-decoration: underline;">ホームページ</a>の要綱をご参照ください</li>
                    </ul>
                </div>
            </div>
        `;

        return html;
    }

    completeNavigator() {
        const chatContainer = document.getElementById('chat-container');
        const inputArea = document.getElementById('input-area');

        const completionHTML = `
            <div class="completion-message">
                <div class="completion-icon">✨</div>
                <div class="completion-text">事業計画書の作成が完了しました！</div>
                <p style="font-size: 0.95rem; color: #10b981; margin-bottom: 1rem;">
                    下のボタンから計画書をダウンロード、印刷、または確認できます。
                </p>
            </div>
        `;

        chatContainer.innerHTML += completionHTML;
        this.scrollToBottom();
    }

    updateProgress() {
        const progressFill = document.getElementById('progress-fill');
        const progressPercentage = (this.currentStep / this.totalSteps) * 100;
        progressFill.style.width = progressPercentage + '%';

        const stepIndicator = document.getElementById('current-step');
        stepIndicator.textContent = `ステップ ${this.currentStep}/${this.totalSteps}`;

        // Update sidebar
        document.querySelectorAll('.step').forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.remove('active', 'completed');

            if (stepNum === this.currentStep) {
                step.classList.add('active');
            } else if (stepNum < this.currentStep) {
                step.classList.add('completed');
            }
        });

        // Update button visibility
        const btnPrev = document.getElementById('btn-prev');
        if (this.currentStep === 1 && this.currentQuestionIndex === 0) {
            btnPrev.style.display = 'none';
        } else {
            btnPrev.style.display = 'block';
        }
    }

    scrollToBottom() {
        const chatContainer = document.getElementById('chat-container');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    formatLabel(value) {
        if (!value) return '-';

        const labels = {
            // Company types
            'corporation': '株式会社',
            'llc': '合同会社',
            'sole-proprietor': '個人事業主',
            'nonprofit': 'NPO法人',
            'cooperative': '協同組合',
            'other': 'その他',
            // Industries
            'manufacturing': '製造業',
            'construction': '建設業',
            'service': 'サービス業',
            'retail': '卸売・小売業',
            'it': 'IT・情報通信',
            'healthcare': '医療・福祉',
            'education': '教育・訓練',
            'agriculture': '農業・漁業',
            // Implementation periods
            '6months': '6ヶ月以内',
            '1year': '1年以内',
            '2years': '2年以内',
            '3years': '3年以内',
            // Innovation levels
            'highly-innovative': '非常に革新的（新しい技術・モデルの導入）',
            'innovative': 'やや革新的（既存事業の大きな改善）',
            'standard': '標準的（通常の事業改善）',
            // Sustainability
            'carbon-neutral': 'カーボンニュートラル達成に貢献',
            'circular-economy': 'サーキュラーエコノミーの実践',
            'energy-efficient': 'エネルギー効率化',
            'water-conservation': '水資源の節約',
            'waste-reduction': '廃棄物削減',
            // Digital adoption
            'ai-ml': 'AI・機械学習の活用',
            'cloud': 'クラウドサービスの導入',
            'iot': 'IoT・センサー技術の活用',
            'blockchain': 'ブロックチェーン技術の活用',
            'automation': '業務自動化',
            // Regional impact
            'job-creation': '雇用創出',
            'local-procurement': '地域資源の活用',
            'community-development': 'コミュニティ発展への貢献',
            'rural-development': '過疎地域の活性化',
            'tourism': '観光産業の振興',
            // Workforce development
            'significant': '重要（従業員研修に予算配分）',
            'moderate': '中程度（部分的な育成計画あり）',
            'minimal': '最小限（現在のところ予定なし）'
        };

        return labels[value] || value;
    }

    handleResize() {
        // Handle responsive adjustments
        if (window.innerWidth < 768) {
            document.querySelector('.sidebar').style.flexDirection = 'row';
        } else {
            document.querySelector('.sidebar').style.flexDirection = 'column';
        }
    }

    downloadPlan() {
        const subsidyData = this.subsidies.find(s => s.id === this.formData.subsidy);
        const companyName = this.formData.companyInfo['company-name'] || '申請者';
        const fileName = `事業計画書_${companyName}_${new Date().toISOString().split('T')[0]}.txt`;

        let content = `補助金申請ナビゲーター - 事業計画書\n`;
        content += `=${'='.repeat(50)}\n\n`;
        content += `【基本情報】\n`;
        content += `補助金制度: ${subsidyData.name}\n`;
        content += `事業者名: ${companyName}\n`;
        content += `組織形態: ${this.formatLabel(this.formData.companyInfo['company-type'])}\n`;
        content += `従業員数: ${this.formData.companyInfo['employees']}\n`;
        content += `業種: ${this.formatLabel(this.formData.companyInfo['industry'])}\n`;
        content += `設立年: ${this.formData.companyInfo['establishment-year']}\n`;
        content += `事業所所在地: ${this.formData.companyInfo['location']}\n\n`;

        content += `【事業計画】\n`;
        content += `現在の事業内容:\n${this.formData.businessPlan['business-summary']}\n\n`;
        content += `プロジェクト名: ${this.formData.businessPlan['project-title']}\n\n`;
        content += `プロジェクト内容:\n${this.formData.businessPlan['project-description']}\n\n`;
        content += `総事業費: ${this.formData.businessPlan['investment-amount']}万円\n`;
        content += `実施期間: ${this.formatLabel(this.formData.businessPlan['implementation-period'])}\n\n`;

        content += `【加点項目】\n`;
        content += `革新性レベル: ${this.formatLabel(this.formData.bonusItems['innovation-level'])}\n`;

        if (this.formData.bonusItems['sustainability']?.length > 0) {
            content += `持続可能性への貢献:\n${this.formData.bonusItems['sustainability'].map(s => `- ${this.formatLabel(s)}`).join('\n')}\n`;
        }

        if (this.formData.bonusItems['digital-adoption']?.length > 0) {
            content += `デジタル化への取組:\n${this.formData.bonusItems['digital-adoption'].map(s => `- ${this.formatLabel(s)}`).join('\n')}\n`;
        }

        if (this.formData.bonusItems['regional-impact']?.length > 0) {
            content += `地域への貢献:\n${this.formData.bonusItems['regional-impact'].map(s => `- ${this.formatLabel(s)}`).join('\n')}\n`;
        }

        content += `人材育成への投資: ${this.formatLabel(this.formData.bonusItems['workforce-development'])}\n\n`;

        content += `${'='.repeat(50)}\n`;
        content += `生成日時: ${new Date().toLocaleString('ja-JP')}\n`;
        content += `注意: この文書は申請用の参考資料です。\n最終的な申請は公式フォーマットを使用してください。`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
    }
}

// Initialize the navigator when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.navigator = new SubsidyNavigator();
});
