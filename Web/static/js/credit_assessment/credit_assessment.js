// KB국민은행 직원 업무시스템 - 여신 심사 JavaScript (FINAL)

console.log('=== credit_assessment.js 로드됨 ===');

// ---------- 전역 보고서 생성 함수 (스크립트 로딩 순서 문제 해결) ----------
window.createAndSaveReport = function() {
    console.log('=== createAndSaveReport 함수 호출됨 (전역) ===');
    
    // 중복 실행 방지
    if (window.isGeneratingReport) {
        console.log('이미 보고서 생성 중입니다.');
        return;
    }
    
    // currentCustomerData가 전역으로 접근 가능한지 확인
    if (typeof window.currentCustomerData === 'undefined' || !window.currentCustomerData) {
        console.log('고객 정보가 없습니다.');
        alert('고객 정보를 먼저 확인해주세요.');
        window.isGeneratingReport = false;
        return;
    }
    
    // third_column (심사 결과 컬럼) 확인
    const thirdColumn = document.querySelector('.third_column');
    console.log('thirdColumn:', thirdColumn);
    console.log('thirdColumn display:', thirdColumn ? thirdColumn.style.display : 'null');
    
    if (!thirdColumn || thirdColumn.style.display === 'none') {
        console.log('심사 결과가 없습니다.');
        alert('심사 결과가 없습니다. 먼저 여신 심사를 진행해주세요.');
        window.isGeneratingReport = false;
        return;
    }
    
    try {
        // 고객명 추출
        const customerName = window.currentCustomerData.full_name || '고객';
        console.log('고객명:', customerName);
        
        // 현재 날짜
        const currentDate = new Date();
        const dateString = currentDate.toLocaleDateString('ko-KR');
        
        // third_column의 HTML 내용을 직접 가져오기
        const thirdColumnHTML = thirdColumn.innerHTML;
        console.log('third_column HTML:', thirdColumnHTML);
        
        // PDF용 HTML 생성 (third_column 내용만 포함)
        const reportContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${customerName}_보고서</title>
                <style>
                    body { font-family: 'Malgun Gothic', sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .title { font-size: 24px; font-weight: bold; color: #1e3a8a; }
                    .subtitle { font-size: 16px; color: #666; margin-top: 10px; }
                    .section { margin: 20px 0; }
                    .section-title { font-size: 18px; font-weight: bold; color: #1e3a8a; margin-bottom: 10px; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                    .info-item { padding: 8px; background: #f8fafc; border-radius: 4px; }
                    .info-label { font-weight: bold; color: #374151; }
                    .info-value { color: #1f2937; }
                    .result-highlight { background: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0; }
                    .approval-status { font-size: 20px; font-weight: bold; }
                    .approved { color: #059669; }
                    .rejected { color: #dc2626; }
                    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">KB국민은행 여신심사 보고서</div>
                    <div class="subtitle">${customerName} 고객 신용평가 결과</div>
                    <div class="subtitle">생성일: ${dateString}</div>
                </div>
                
                <div class="third_column">
                    ${thirdColumnHTML}
                </div>
                
                <div class="footer">
                    <p>본 보고서는 KB국민은행 여신심사 시스템에 의해 자동 생성되었습니다.</p>
                    <p>문의사항이 있으시면 담당자에게 연락바랍니다.</p>
                </div>
            </body>
            </html>
        `;
        
        // 실제 PDF 생성
        const fileName = `${customerName}_여신심사보고서.pdf`;
        
        // 간단한 PDF 생성 함수 (브라우저 인쇄 기능 사용)
        const generatePDF = async () => {
            try {
                console.log('PDF 생성 시작...');
                
                // 브라우저 인쇄 기능을 사용하여 PDF 생성
                const printWindow = window.open('', '_blank', 'width=800,height=600');
                
                if (!printWindow) {
                    throw new Error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
                }
                
                // 완전한 HTML 문서 생성
                const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>${fileName}</title>
                        <style>
                            @page {
                                margin: 20mm;
                                size: A4;
                            }
                            
                            * {
                                box-sizing: border-box;
                            }
                            
                            body {
                                font-family: 'Malgun Gothic', '맑은 고딕', 'Apple SD Gothic Neo', sans-serif;
                                margin: 0;
                                padding: 20px;
                                line-height: 1.6;
                                color: #333;
                                background: white;
                            }
                            
                            .header {
                                text-align: center;
                                margin-bottom: 30px;
                                border-bottom: 2px solid #1e3a8a;
                                padding-bottom: 20px;
                            }
                            
                            .title {
                                font-size: 24px;
                                font-weight: bold;
                                color: #1e3a8a;
                                margin-bottom: 10px;
                            }
                            
                            .subtitle {
                                font-size: 16px;
                                color: #666;
                                margin: 5px 0;
                            }
                            
                            .content {
                                margin: 20px 0;
                            }
                            
                            .section {
                                margin: 20px 0;
                                padding: 15px;
                                background: #f8f9fa;
                                border-radius: 8px;
                                border-left: 4px solid #1e3a8a;
                            }
                            
                            .section-title {
                                font-size: 18px;
                                font-weight: bold;
                                color: #1e3a8a;
                                margin-bottom: 10px;
                            }
                            
                            .info-grid {
                                display: grid;
                                grid-template-columns: 1fr 1fr;
                                gap: 10px;
                                margin: 10px 0;
                            }
                            
                            .info-item {
                                padding: 8px;
                                background: white;
                                border-radius: 4px;
                                border: 1px solid #e5e7eb;
                            }
                            
                            .info-label {
                                font-weight: bold;
                                color: #374151;
                                font-size: 14px;
                            }
                            
                            .info-value {
                                color: #1f2937;
                                margin-top: 4px;
                            }
                            
                            .result-highlight {
                                background: #dbeafe;
                                padding: 15px;
                                border-radius: 8px;
                                margin: 15px 0;
                                border-left: 4px solid #1e3a8a;
                            }
                            
                            .approval-status {
                                font-size: 20px;
                                font-weight: bold;
                            }
                            
                            .approved {
                                color: #059669;
                            }
                            
                            .rejected {
                                color: #dc2626;
                            }
                            
                            .footer {
                                margin-top: 40px;
                                text-align: center;
                                color: #666;
                                font-size: 12px;
                                border-top: 1px solid #e5e7eb;
                                padding-top: 20px;
                            }
                            
                            @media print {
                                body {
                                    margin: 0;
                                    padding: 20px;
                                }
                                
                                .no-print {
                                    display: none;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <div class="title">KB국민은행 여신심사 보고서</div>
                            <div class="subtitle">${customerName} 고객 신용평가 결과</div>
                            <div class="subtitle">생성일: ${dateString}</div>
                        </div>
                        
                        <div class="content">
                            ${thirdColumnHTML}
                        </div>
                        
                        <div class="footer">
                            <p>본 보고서는 KB국민은행 여신심사 시스템에 의해 자동 생성되었습니다.</p>
                            <p>문의사항이 있으시면 담당자에게 연락바랍니다.</p>
                        </div>
                        
                        <script>
                            window.onload = function() {
                                // 페이지 로드 후 인쇄 대화상자 열기
                                setTimeout(function() {
                                    window.print();
                                    
                                    // 인쇄 후 창 닫기 (사용자가 취소해도 5초 후 자동 닫기)
                                    setTimeout(function() {
                                        window.close();
                                    }, 5000);
                                }, 1000);
                            };
                            
                            // 인쇄 완료 이벤트 처리
                            window.onafterprint = function() {
                                setTimeout(function() {
                                    window.close();
                                }, 1000);
                            };
                        </script>
                    </body>
                    </html>
                `;
                
                printWindow.document.write(htmlContent);
                printWindow.document.close();
                
                // HTML Blob 생성하여 다운로드 옵션 제공
                const blob = new Blob([htmlContent], { 
                    type: 'text/html; charset=utf-8' 
                });
                const pdfUrl = URL.createObjectURL(blob);
                
                console.log('PDF URL 생성 완료:', pdfUrl);
                return pdfUrl;
                
            } catch (error) {
                console.error('PDF 생성 오류:', error);
                
                // 최종 fallback - 간단한 HTML
                const fallbackContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>${fileName}</title>
                        <style>
                            body { 
                                font-family: 'Malgun Gothic', sans-serif; 
                                margin: 20px; line-height: 1.6;
                            }
                            .header { 
                                text-align: center; margin-bottom: 30px; 
                                border-bottom: 2px solid #1e3a8a; 
                                padding-bottom: 20px;
                            }
                            .title { 
                                font-size: 24px; font-weight: bold; 
                                color: #1e3a8a; 
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <div class="title">KB국민은행 여신심사 보고서</div>
                            <div>${customerName} 고객 신용평가 결과</div>
                            <div>생성일: ${dateString}</div>
                        </div>
                        <div>
                            <p>보고서 내용이 여기에 표시됩니다.</p>
                            <p>PDF 생성 중 오류가 발생하여 기본 형식으로 표시됩니다.</p>
                        </div>
                    </body>
                    </html>
                `;
                
                const blob = new Blob([fallbackContent], { type: 'text/html; charset=utf-8' });
                return URL.createObjectURL(blob);
            }
        };
        
        // PDF 생성 및 다운로드
        generatePDF().then((pdfUrl) => {
            // 보고서 객체 생성
            const report = {
                name: customerName + '_여신심사보고서',
                filename: fileName,
                url: pdfUrl,
                date: dateString,
                type: 'PDF'
            };
            
            console.log('생성된 보고서 객체:', report);
            
            // ReportsColumn에 보고서 추가
            console.log('window.reportsColumn:', window.reportsColumn);
            if (window.reportsColumn) {
                console.log('보고서 추가 시도:', report);
                window.reportsColumn.addReport(report);
                console.log('보고서가 목록에 추가되었습니다.');
            } else {
                console.error('ReportsColumn 인스턴스를 찾을 수 없습니다.');
                alert('보고서 목록에 추가할 수 없습니다. 페이지를 새로고침해주세요.');
            }
            
            // 자동 다운로드 트리거 (실제 PDF 파일 다운로드)
            try {
                console.log('다운로드 시작:', fileName);
                
                // PDF Blob을 직접 다운로드
                if (pdfUrl.startsWith('blob:')) {
                    // Blob을 직접 다운로드
                    const link = document.createElement('a');
                    link.href = pdfUrl;
                    link.download = fileName;
                    link.style.display = 'none';
                    
                    // MIME 타입 명시적 설정
                    link.setAttribute('type', 'application/pdf');
                    
                    document.body.appendChild(link);
                    link.click();
                    
                    // 정리
                    setTimeout(() => {
                        document.body.removeChild(link);
                        URL.revokeObjectURL(pdfUrl);
                    }, 1000);
                    
                    console.log('PDF 다운로드 완료:', fileName);
                    
                    // 성공 메시지
                    alert(`${fileName} 파일이 다운로드되었습니다.`);
                    
                } else {
                    // URL인 경우 새 창에서 열기
                    window.open(pdfUrl, '_blank');
                }
                
            } catch (downloadError) {
                console.error('다운로드 오류:', downloadError);
                
                // 최종 대안: 브라우저 인쇄 기능 사용
                const printWindow = window.open('', '_blank', 'width=800,height=600');
                if (printWindow) {
                    printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <title>${fileName}</title>
                            <style>
                                @page { margin: 20mm; size: A4; }
                                body { 
                                    font-family: 'Malgun Gothic', sans-serif; 
                                    margin: 0; padding: 20px; 
                                    line-height: 1.6; color: #333;
                                }
                                .header { 
                                    text-align: center; margin-bottom: 30px; 
                                    border-bottom: 2px solid #1e3a8a; 
                                    padding-bottom: 20px;
                                }
                                .title { 
                                    font-size: 24px; font-weight: bold; 
                                    color: #1e3a8a; margin-bottom: 10px;
                                }
                                .subtitle { 
                                    font-size: 16px; color: #666; margin: 5px 0;
                                }
                                .content { margin: 20px 0; }
                                .footer { 
                                    margin-top: 40px; text-align: center; 
                                    color: #666; font-size: 12px; 
                                    border-top: 1px solid #e5e7eb; 
                                    padding-top: 20px;
                                }
                                @media print {
                                    body { margin: 0; padding: 20px; }
                                }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <div class="title">KB국민은행 여신심사 보고서</div>
                                <div class="subtitle">${customerName} 고객 신용평가 결과</div>
                                <div class="subtitle">생성일: ${dateString}</div>
                            </div>
                            <div class="content">
                                ${thirdColumnHTML}
                            </div>
                            <div class="footer">
                                <p>본 보고서는 KB국민은행 여신심사 시스템에 의해 자동 생성되었습니다.</p>
                                <p>문의사항이 있으시면 담당자에게 연락바랍니다.</p>
                            </div>
                            <script>
                                window.onload = function() {
                                    setTimeout(function() {
                                        window.print();
                                        setTimeout(function() {
                                            window.close();
                                        }, 5000);
                                    }, 1000);
                                };
                                window.onafterprint = function() {
                                    setTimeout(function() {
                                        window.close();
                                    }, 1000);
                                };
                            </script>
                        </body>
                        </html>
                    `);
                    printWindow.document.close();
                } else {
                    alert('PDF 생성이 완료되었지만 다운로드에 실패했습니다. 브라우저 설정을 확인해주세요.');
                }
            }
            
        }).catch((error) => {
            console.error('PDF 생성 실패:', error);
            alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
        });
        
        console.log('보고서 생성 및 다운로드 완료:', fileName);
        
        // 생성 완료 후 플래그 해제
        window.isGeneratingReport = false;
        
    } catch (error) {
        console.error('보고서 생성 중 오류 발생:', error);
        alert('보고서 생성 중 오류가 발생했습니다: ' + error.message);
        
        // 오류 발생 시에도 플래그 해제
        window.isGeneratingReport = false;
    }
};

console.log('=== createAndSaveReport 함수 정의 완료 (전역) ===');

document.addEventListener('DOMContentLoaded', function () {
    console.log('=== DOMContentLoaded 이벤트 발생 ===');
    // --- 공통 DOM ---
    const btnAssess = document.getElementById('btn_assess');
    const btnReset = document.getElementById('btn_reset');
    const btnCheckCustomer = document.getElementById('btn_check_customer');
    const customerDisplayContent = document.getElementById('customer_display_content');
    
    // --- 개인/기업 토글 버튼 ---
    const toggleButtons = document.querySelectorAll('.toggle_button');
    let currentAssessmentType = 'personal'; // 기본값: 개인

    const usageGuideContainer = document.getElementById('usage_guide_container');
    const assessmentResults = document.getElementById('assessment_results');
    const resultsContent = document.getElementById('results_content');

    const form = document.querySelector('.credit_assessment_content');
    const inputs = form ? form.querySelectorAll('input, select') : [];

    const loanPurposeSelect = document.getElementById('loan_purpose');
    const loanProductSelect = document.getElementById('loan_product');

    // (선택) 레이아웃 1,2행이 있으면 연결
    const firstRow = document.querySelector('.first_row') || document.getElementById('first_row');
    const secondRow = document.querySelector('.second_row') || document.getElementById('second_row');
    const thirdRow = document.querySelector('.third_row') || document.getElementById('third_row');
    
    console.log('DOM 요소 확인:', {
        firstRow: !!firstRow,
        secondRow: !!secondRow,
        thirdRow: !!thirdRow,
        thirdRowElement: thirdRow
    });
    
    // thirdRow 요소가 없으면 경고
    if (!thirdRow) {
        console.error('thirdRow 요소를 찾을 수 없습니다!');
        console.log('사용 가능한 .third_row 요소들:', document.querySelectorAll('.third_row'));
        console.log('사용 가능한 #third_row 요소들:', document.querySelectorAll('#third_row'));
    }

    // 조회된 고객 정보를 저장할 전역 변수
    let currentCustomerData = null;

    // ---------- 유틸 ----------
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === name + '=') {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
            }
        }
        }
        return cookieValue;
    }

    function safeJSONParse(maybeJson, fallback = { data: [], layout: {} }) {
        try {
        if (typeof maybeJson === 'string') return JSON.parse(maybeJson);
        if (typeof maybeJson === 'object' && maybeJson !== null) return maybeJson;
        return fallback;
        } catch {
        return fallback;
        }
    }

    function showError(input, message) {
        input.classList.add('error');
        const errorElement = document.getElementById(input.id + '_error');
        if (errorElement) {
            errorElement.innerHTML = `<i class="bi bi-exclamation-circle-fill"></i> ${message}`;
        } else {
            const newError = document.createElement('span');
            newError.id = input.id + '_error';
            newError.className = 'error-message';
            newError.innerHTML = `<i class="bi bi-exclamation-circle-fill"></i> ${message}`;
            input.parentNode.insertBefore(newError, input.nextSibling);
        }
        // 에러 클래스는 사용자가 입력을 시작할 때까지 유지
        // setTimeout(() => input.classList.remove('error'), 400);
    }

    function clearAllErrors() {
        const allInputs = document.querySelectorAll('.input_grid input, .input_grid select');
        allInputs.forEach((i) => i.classList.remove('error'));
        const msgs = document.querySelectorAll('.error-message');
        msgs.forEach((m) => (m.innerHTML = ''));
    }

    function showResultsPage() {
        if (usageGuideContainer) usageGuideContainer.style.display = 'none';
        if (assessmentResults) assessmentResults.style.display = 'flex';
    }

    function hideResultsPage() {
        if (assessmentResults) assessmentResults.style.display = 'none';
        if (usageGuideContainer) usageGuideContainer.style.display = 'flex';
    }

    // ---------- 폼 검증 ----------
    function validateForm() {
        let isValid = true;
        clearAllErrors();

        // 고객 정보 검증 (currentCustomerData가 없을 때만)
        if (!currentCustomerData) {
            const customerName = document.getElementById('customer_name');
            const customerRrn = document.getElementById('customer_rrn');
            const customerPhone = document.getElementById('customer_phone');
            if (!customerName.value.trim()) {
                showError(customerName, '고객명을 입력해주세요.');
                isValid = false;
            }
            if (!customerRrn.value.trim()) {
                showError(customerRrn, '주민번호를 입력해주세요.');
                isValid = false;
            }
            if (!customerPhone.value.trim()) {
                showError(customerPhone, '연락처를 입력해주세요.');
                isValid = false;
            }
        }

        // 대출 정보 검증 (항상 수행)
        const loanAmount = document.getElementById('loan_amount');
        const loanPurpose = document.getElementById('loan_purpose');
        const loanProduct = document.getElementById('loan_product');
        const loanPeriod = document.getElementById('loan_period');

        if (!loanAmount.value.trim()) {
            showError(loanAmount, '대출 신청 금액을 입력해주세요.');
            isValid = false;
        }
        if (!loanPurpose.value) {
            showError(loanPurpose, '대출 목적을 선택해주세요.');
            isValid = false;
        }
        if (!loanProduct.value) {
            showError(loanProduct, '대출 상품을 선택해주세요.');
            isValid = false;
        }
        if (!loanPeriod.value.trim()) {
            showError(loanPeriod, '대출 기간을 입력해주세요.');
            isValid = false;
        }
        
        return isValid;
    }

    // ---------- 고객 확인 ----------
    function displayCustomerInfo(customer) {
        const html = `
        <div class="customer_info_grid">
            <div class="info_item"><div class="info_label">고객 ID</div><div class="info_value">${customer.id}</div></div>
            <div class="info_item"><div class="info_label">고객명</div><div class="info_value">${customer.full_name}</div></div>
            <div class="info_item"><div class="info_label">나이</div><div class="info_value">${customer.age}세</div></div>
            <div class="info_item"><div class="info_label">성별</div><div class="info_value">${customer.gender}</div></div>
            <div class="info_item"><div class="info_label">연락처</div><div class="info_value">${customer.phone}</div></div>
            <div class="info_item"><div class="info_label">이메일</div><div class="info_value">${customer.email}</div></div>
            <div class="info_item"><div class="info_label">최종 학력</div><div class="info_value">${customer.education_level}</div></div>
            <div class="info_item"><div class="info_label">회사명</div><div class="info_value">${customer.company_name}</div></div>
            <div class="info_item"><div class="info_label">직종</div><div class="info_value">${customer.job_title}</div></div>
            <div class="info_item"><div class="info_label">근속년수</div><div class="info_value">${customer.years_of_service}년</div></div>
            <div class="info_item"><div class="info_label">주택 상태</div><div class="info_value">${customer.housing_status}</div></div>
        </div>`;
        customerDisplayContent.innerHTML = html;
    }

    function displayCustomerNotFound(message) {
        customerDisplayContent.innerHTML = `
        <div class="customer_not_found">
            <i class="bi bi-person-x"></i>
            <p>${message || '가입하지 않은 고객입니다.'}</p>
        </div>`;
    }

    function checkCustomerInfo() {
        console.log('=== checkCustomerInfo 함수 호출됨 ===');
        let isValid = true;
        clearAllErrors();
        const customerName = document.getElementById('customer_name');
        const customerRrn = document.getElementById('customer_rrn');
        const customerPhone = document.getElementById('customer_phone');
        
        console.log('고객 정보 입력값:', {
            name: customerName ? customerName.value : 'null',
            rrn: customerRrn ? customerRrn.value : 'null',
            phone: customerPhone ? customerPhone.value : 'null'
        });

        if (!customerName.value.trim()) {
        showError(customerName, '고객명을 입력해주세요.');
        isValid = false;
        }
        if (!customerRrn.value.trim()) {
        showError(customerRrn, '주민번호를 입력해주세요.');
        isValid = false;
        }
        if (!customerPhone.value.trim()) {
        showError(customerPhone, '연락처를 입력해주세요.');
        isValid = false;
        }
        if (!isValid) return;

        btnCheckCustomer.disabled = true;
        btnCheckCustomer.innerHTML = '<i class="bi bi-hourglass-split"></i><span>확인 중...</span>';

        fetch('/kb_bank/credit_assessment/api/check-customer/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
            customer_name: customerName.value.trim(),
            customer_rrn: customerRrn.value.trim(),
            customer_phone: customerPhone.value.trim(),
        }),
        })
        .then((response) => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.indexOf('application/json') !== -1) {
            return response.json();
            } else {
            return response.text().then((text) => {
                throw new Error('서버로부터 유효하지 않은 응답을 받았습니다. 응답 내용:\n' + text.substring(0, 200) + '...');
            });
            }
        })
        .then((data) => {
            console.log('고객 정보 확인 응답:', data);
            if (data.success && data.customer_found) {
            console.log('고객 정보 확인 성공 - third_row 표시 시작');
            
            // 헤더 스위칭
            const customerInfoHeader = document.querySelector('.customer_info_header');
            const customerDisplayHeader = document.querySelector('.customer_display_header');
            if (customerDisplayHeader) {
                const headerTitle = customerDisplayHeader.querySelector('.header_title');
                if (headerTitle) {
                    // 개인/기업에 따른 헤더 제목 설정
                    const typeText = currentAssessmentType === 'personal' ? '개인' : '기업';
                    headerTitle.textContent = `${typeText} 고객 정보`;
                }
            }
            if (customerInfoHeader) customerInfoHeader.style.display = 'none';
            if (customerDisplayHeader) customerDisplayHeader.style.display = 'flex';
            
            // 토글 버튼 숨기기
            const assessmentTypeToggle = document.querySelector('.assessment_type_toggle');
            if (assessmentTypeToggle) {
                assessmentTypeToggle.style.display = 'none';
            }

            displayCustomerInfo(data.customer);
            currentCustomerData = data.customer;
            // 전역 접근을 위해 window 객체에도 저장
            window.currentCustomerData = data.customer;

            // 좌측 입력영역 토글
            const inputGrid = document.querySelector('.input_grid');
            const bankerNotes = document.querySelector('.banker_notes');
            const customerCheckActions = document.querySelector('.customer_check_actions');
            if (inputGrid) inputGrid.style.display = 'none';
            if (bankerNotes) bankerNotes.style.display = 'none';
            if (customerCheckActions) customerCheckActions.style.display = 'none';

            if (customerDisplayContent) customerDisplayContent.style.display = 'block';
            if (secondRow) secondRow.style.display = 'flex';
            
            console.log('=== third_row 디버깅 시작 ===');
            console.log('thirdRow 요소 확인:', thirdRow);
            
            if (thirdRow) {
                console.log('thirdRow 요소 발견 - 상세 정보:');
                console.log('- 요소 ID:', thirdRow.id);
                console.log('- 클래스명:', thirdRow.className);
                console.log('- 부모 요소:', thirdRow.parentNode);
                console.log('- 현재 display:', thirdRow.style.display);
                console.log('- 현재 visibility:', thirdRow.style.visibility);
                console.log('- 현재 opacity:', thirdRow.style.opacity);
                console.log('- computed display:', window.getComputedStyle(thirdRow).display);
                console.log('- computed visibility:', window.getComputedStyle(thirdRow).visibility);
                console.log('- computed opacity:', window.getComputedStyle(thirdRow).opacity);
                console.log('- 요소 위치:', thirdRow.getBoundingClientRect());
                
                // 강제로 표시
                thirdRow.style.display = 'flex';
                thirdRow.style.visibility = 'visible';
                thirdRow.style.opacity = '1';
                thirdRow.style.height = 'auto';
                thirdRow.style.overflow = 'visible';
                
                console.log('third_row 표시 설정 완료');
                console.log('설정 후 스타일:', {
                    display: thirdRow.style.display,
                    visibility: thirdRow.style.visibility,
                    opacity: thirdRow.style.opacity,
                    height: thirdRow.style.height,
                    overflow: thirdRow.style.overflow
                });
                
                // 설정 후 computed 스타일 확인
                setTimeout(() => {
                    console.log('설정 후 computed 스타일:', {
                        display: window.getComputedStyle(thirdRow).display,
                        visibility: window.getComputedStyle(thirdRow).visibility,
                        opacity: window.getComputedStyle(thirdRow).opacity,
                        height: window.getComputedStyle(thirdRow).height,
                        overflow: window.getComputedStyle(thirdRow).overflow
                    });
                    console.log('설정 후 요소 위치:', thirdRow.getBoundingClientRect());
                    console.log('요소가 화면에 보이는가?', thirdRow.offsetParent !== null);
                }, 100);
                
                // DOM에 강제로 추가 (혹시 DOM에서 제거되었을 경우)
                if (!thirdRow.parentNode) {
                    console.log('⚠️ thirdRow가 DOM에서 제거됨 - 다시 추가 시도');
                    const secondColumn = document.querySelector('.second_column');
                    if (secondColumn) {
                        secondColumn.appendChild(thirdRow);
                        console.log('thirdRow를 .second_column에 다시 추가함');
                    } else {
                        console.log('❌ .second_column 요소를 찾을 수 없음');
                    }
                } else {
                    console.log('✅ thirdRow가 DOM에 정상적으로 존재함');
                }
                
                // CSS 규칙 확인
                const cssRules = [];
                for (let i = 0; i < document.styleSheets.length; i++) {
                    try {
                        const sheet = document.styleSheets[i];
                        if (sheet.cssRules) {
                            for (let j = 0; j < sheet.cssRules.length; j++) {
                                const rule = sheet.cssRules[j];
                                if (rule.selectorText && rule.selectorText.includes('third_row')) {
                                    cssRules.push({
                                        selector: rule.selectorText,
                                        style: rule.style.cssText
                                    });
                                }
                            }
                        }
                    } catch (e) {
                        console.log('CSS 규칙 접근 오류:', e);
                    }
                }
                console.log('third_row 관련 CSS 규칙:', cssRules);
                
            } else {
                console.log('❌ thirdRow 요소를 찾을 수 없음');
                console.log('사용 가능한 .third_row 요소들:', document.querySelectorAll('.third_row'));
                console.log('사용 가능한 #third_row 요소들:', document.querySelectorAll('#third_row'));
                console.log('전체 DOM에서 third_row 검색:', document.querySelectorAll('[class*="third"]'));
            }
            console.log('=== third_row 디버깅 끝 ===');
            } else {
            console.log('고객 정보 확인 실패:', data.message);
            displayCustomerNotFound(data.message || '일치하는 고객 정보가 없습니다.');
            if (customerDisplayContent) customerDisplayContent.style.display = 'block';
            }
        })
        .catch((error) => {
            console.error('고객 정보 조회 중 오류 발생:', error);
            displayCustomerNotFound('고객 정보 조회 중 오류가 발생했습니다. 관리자에게 문의하세요.');
            if (customerDisplayContent) customerDisplayContent.style.display = 'block';
        })
        .finally(() => {
            btnCheckCustomer.disabled = false;
            btnCheckCustomer.innerHTML = '<i class="bi bi-search"></i><span>고객 정보 확인</span>';
        });
    }

    // ---------- 대출 상품 ----------
    function updateLoanProducts() {
        const loanPurpose = loanPurposeSelect.value;
        loanProductSelect.innerHTML = '<option value="">대출 목적을 먼저 선택하세요</option>';
        if (!loanPurpose) return;

        loanProductSelect.innerHTML = '<option value="">상품을 불러오는 중...</option>';
        loanProductSelect.disabled = true;

        setTimeout(() => {
        const mockProducts = {
            house: [
            { id: '1', name: 'KB주택담보대출', interest_rate: 3.5, min_amount: 10000000, max_amount: 500000000 },
            { id: '2', name: 'KB전세자금대출', interest_rate: 4.2, min_amount: 5000000, max_amount: 200000000 },
            { id: '3', name: 'KB신축주택대출', interest_rate: 3.8, min_amount: 20000000, max_amount: 300000000 },
            ],
            business: [
            { id: '4', name: 'KB사업자대출', interest_rate: 5.5, min_amount: 10000000, max_amount: 100000000 },
            { id: '5', name: 'KB창업자금대출', interest_rate: 4.8, min_amount: 5000000, max_amount: 50000000 },
            { id: '6', name: 'KB운영자금대출', interest_rate: 6.2, min_amount: 3000000, max_amount: 30000000 },
            ],
            education: [
            { id: '7', name: 'KB교육비대출', interest_rate: 4.5, min_amount: 1000000, max_amount: 50000000 },
            { id: '8', name: 'KB유학자금대출', interest_rate: 5.8, min_amount: 5000000, max_amount: 100000000 },
            ],
            medical: [
            { id: '9', name: 'KB의료비대출', interest_rate: 6.5, min_amount: 1000000, max_amount: 30000000 },
            { id: '10', name: 'KB건강보험대출', interest_rate: 5.2, min_amount: 500000, max_amount: 10000000 },
            ],
            living: [
            { id: '11', name: 'KB생활비대출', interest_rate: 7.2, min_amount: 500000, max_amount: 20000000 },
            { id: '12', name: 'KB신용대출', interest_rate: 8.5, min_amount: 1000000, max_amount: 50000000 },
            ],
            other: [{ id: '13', name: 'KB기타목적대출', interest_rate: 6.8, min_amount: 1000000, max_amount: 30000000 }],
        };

        const products = mockProducts[loanPurpose] || [];
        loanProductSelect.innerHTML = '<option value="">대출 상품을 선택하세요</option>';
        products.forEach((p) => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = `${p.name} (${p.interest_rate}%)`;
            option.dataset.minAmount = p.min_amount;
            option.dataset.maxAmount = p.max_amount;
            option.dataset.interestRate = p.interest_rate;
            loanProductSelect.appendChild(option);
        });
        loanProductSelect.disabled = false;
        }, 500);
    }

    // ---------- ML 심사 ----------
    function getLoanData() {
        const amountRaw = document.getElementById('loan_amount').value.replace(/[^0-9]/g, '');
        const period = document.getElementById('loan_period').value;
        const loanProductSelect = document.getElementById('loan_product');
        const selectedOption = loanProductSelect.options[loanProductSelect.selectedIndex];
        const interestRate = selectedOption ? selectedOption.dataset.interestRate : '5.0'; // 기본값 5.0

        return {
            amount: parseInt(amountRaw, 10) || 0,
            period: parseInt(period, 10) || 12,
            interest_rate: parseFloat(interestRate) || 5.0,
        };
    }

    function performAssessment() {
        btnAssess.disabled = true;
        btnAssess.innerHTML = '<i class="bi bi-hourglass-split"></i><span>심사 중...</span>';

        // 심사 요청 시 즉시 결과 화면으로 전환하여 사용자 경험 개선
        showResultsPage();
        callMLAssessmentAPI();
    }

    function callMLAssessmentAPI() {
        const requestData = {
        customer_data: currentCustomerData,
        loan_data: getLoanData(),
        };

        fetch('/kb_bank/credit_assessment/api/assess-credit/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify(requestData),
        })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
            // 2) 시각화/텍스트 렌더는 방어적으로 수행
            try {
                const safe = (obj, key, fallback) => (obj && obj[key] != null ? obj[key] : fallback);
                const r = data.assessment_result || {};
                
                // credit_rating 값이 항상 문자열이 되도록 보장
                let creditRating = safe(r, 'credit_rating', '-');
                if (typeof creditRating !== 'string') creditRating = '-';

                displayMLAssessmentResults({
                credit_score: safe(r, 'credit_score', 0),
                credit_rating: creditRating,
                approval_status: safe(r, 'approval_status', 'rejected'),
                recommended_limit: safe(r, 'recommended_limit', 0),
                credit_score_chart: safe(r, 'credit_score_chart', '{"data":[],"layout":{}}'),
                progress_chart: safe(r, 'progress_chart', '{"data":[],"layout":{}}'),
                risk_analysis_chart: safe(r, 'risk_analysis_chart', '{"data":[],"layout":{}}'),
                financial_indicators: safe(r, 'financial_indicators', {}),
                risk_matrix: safe(r, 'risk_matrix', []),
                ai_report: safe(r, 'ai_report', {
                    summary_title: '결과 요약',
                    summary_description: '데이터가 충분하지 않아 기본 설명을 표시합니다.',
                    analysis_details: [],
                    recommendations: [],
                    warnings: [],
                }),
                });
            } catch (e) {
                console.error('결과 렌더링 중 오류:', e);
                const desc = document.getElementById('ai_summary_description');
                if (desc) {
                desc.innerHTML = '시각화 렌더링에 실패했지만 결과 페이지는 표시되었습니다. 로그를 확인해 주세요.';
                }
            }
            } else {
            console.error('ML API 처리 실패:', data.message);
            alert('심사 중 오류가 발생했습니다: ' + data.message);
            hideResultsPage();
            }
        })
        .catch((err) => {
            console.error('API 호출 오류:', err);
            alert('심사 API 호출 중 오류가 발생했습니다.');
            hideResultsPage();
        })
        .finally(() => {
            btnAssess.disabled = false;
            btnAssess.innerHTML = '<i class="bi bi-clipboard-check"></i><span>여신 심사 요청</span>';
        });
    }

    function displayMLAssessmentResults(data) {
        updateBasicInfo(data);
        updateCreditScoreDescription(data.credit_score);
        renderCreditScoreChart(data.credit_score_chart);
        renderProgressChart(data.progress_chart);
        renderRiskAnalysisChart(data.risk_analysis_chart);
        updateFinancialIndicators(data.financial_indicators || {});
        updateRiskMatrix(data.risk_matrix || []);
        updateAiReport(data.ai_report || {}, data.approval_status);
    }

    function updateBasicInfo(data) {
        const creditScoreElement = resultsContent.querySelector('.credit_score');
        const creditRatingElement = resultsContent.querySelector('.credit_rating');
        const approvalStatusElement = resultsContent.querySelector('.approval_status');
        const recommendedLimitElement = document.getElementById('recommended_limit');
        const scoreDetailText = document.getElementById('credit_score_detail_text');
        const scoreDescriptionMain = document.getElementById('credit_score_description_main');

        if (creditScoreElement) creditScoreElement.textContent = data.credit_score;
        if (creditRatingElement) creditRatingElement.textContent = data.credit_rating;
        if (approvalStatusElement) {
        approvalStatusElement.textContent = data.approval_status === 'approved' ? '승인 가능' : '불가능';
        approvalStatusElement.className = `summary_value approval_status ${data.approval_status}`;
        }
        if (recommendedLimitElement) {
        recommendedLimitElement.textContent = `${Math.floor((data.recommended_limit || 0) / 10000).toLocaleString()}만원`;
        }
        if (scoreDetailText) scoreDetailText.textContent = `${data.credit_score}/1000점`;
        if (scoreDescriptionMain) {
        scoreDescriptionMain.innerHTML = `<strong>신용점수 ${data.credit_score}점</strong>은 1000점 만점 기준으로 <strong>${data.credit_rating}</strong> 등급에 해당합니다.`;
        }
    }

    function updateCreditScoreDescription(score) {
        const detailEl = document.getElementById('credit_score_description_detail');
        const benefitEl = document.querySelector('.credit_score_discription .description_benefit');
        if (!detailEl || !benefitEl) return;

        let detailText, benefitText;

        if (score >= 850) {
            detailText = "고객은 지속적인 신용거래 이력과 우수한 상환 습관을 보유하고 있으며, 최근 연체·부실 기록이 거의 없어 신용리스크가 극히 낮습니다. 내부 자동심사 기준을 충족하여 최소한의 서류 확인만으로도 신속한 한도 산정과 금리 적용이 가능하며, 대규모 공여의 경우에도 내부 추가 검증을 거쳐 우대조건을 제공할 수 있습니다. 전반적으로 대출 취급에 있어 예외적인 리스크가 없으므로 비대면 처리 및 우선 심사 대상으로 분류됩니다.";
            benefitText = "<strong>대출 승인 가능성: 최상</strong> | <strong>적용 가능 금리: 업계 최저·우대금리</strong> | <strong>예상 한도: 최대 한도 승인 가능(심사조건 충족 시)</strong> | <strong>심사 처리: 즉시 자동 승인·우선 처리</strong> | <strong>필요 서류: 최소화(전자소득조회 등 자동 확인)</strong>";
        } else if (score >= 700) {
            detailText = "전반적인 신용활동과 상환능력이 양호하여 금융기관 관점에서 신뢰도가 높은 편입니다. 소액의 과거 연체가 있었더라도 회복된 이력이 있다면 우수 등급으로 분류되며, 대부분의 금융상품을 유리한 조건으로 이용할 수 있습니다. 다만 개인별 DTI(부채비율)나 최근 채무증가와 같은 개별 리스크 요인에 따라 한도나 금리가 조정될 수 있으므로, 고액 신청 시 추가 소득증빙을 요구하거나 조건부 한도가 제시될 수 있습니다.";
            benefitText = "<strong>대출 승인 가능성: 매우 높음</strong> | <strong>우대 금리 적용 가능</strong> | <strong>예상 한도: 비교적 높은 한도 승인 예상</strong> | <strong>심사 처리: 대부분 자동 또는 조건부 자동 심사</strong> | <strong>권장 조치: DTI 개선 시 추가 혜택 및 한도 상향 가능</strong>";
        } else if (score >= 500) {
            detailText = "신용 상태가 평균 수준으로 정상적인 금융거래는 가능하나 일부 상품이나 고액 대출에 대해서는 제약이 발생할 수 있습니다. 과거 연체 이력, 소득 불안정, 혹은 근속기간 미충족 등의 요인이 있으면 심사 시 가중치가 부여되어 추가 서류 제출이나 수동심사가 요구될 가능성이 큽니다. 신용 점수 향상을 위해 규칙적인 상환, 사용패턴 개선 및 부채 축소 노력이 권장됩니다.";
            benefitText = "<strong>대출 승인 가능성: 보통</strong> | <strong>적용 금리: 표준 금리 적용</strong> | <strong>예상 한도: 심사 후 한도 결정(조건부 한도 적용 가능)</strong> | <strong>요구 서류: 추가 소득·재직증빙 필요할 수 있음</strong> | <strong>권장 조치: 부채통합 및 상환계획 수립 권고</strong>";
        } else {
            detailText = "현재 신용점수는 낮은 수준으로 평가되며, 연체·부실 발생 가능성이 높아 즉시 대출 승인되기 어렵거나 매우 엄격한 조건(담보·보증인 제공, 고금리 적용 등)이 요구될 수 있습니다. 반복적 연체나 파산 이력이 있는 경우에는 자동거절 규정이 적용될 수 있으므로 우선적으로 채무 정리와 상환 계획 수립이 필요합니다. 필요시 금융 상담을 통해 채무조정 및 재무구조 개선 방안을 안내합니다.";
            benefitText = "<strong>대출 승인 가능성: 낮음</strong> | <strong>적용 금리: 높은 금리 적용</strong> | <strong>예상 한도: 제한적 또는 담보·보증인 필요</strong> | <strong>심사 처리: 수동심사 및 추가심사 필요</strong> | <strong>권장 조치: 채무조정·상환플랜 수립 권고</strong>";
        }

        detailEl.textContent = detailText;
        benefitEl.innerHTML = benefitText;
    }

    function renderCreditScoreChart(chartData) {
        const chartContainer = document.getElementById('credit_score_chart_container');
        if (chartContainer && window.Plotly) {
        const cfg = safeJSONParse(chartData);
        Plotly.newPlot('credit_score_chart_container', cfg.data, cfg.layout, {
            responsive: true,
            displayModeBar: false,
        });
        }
    }

    function renderRiskAnalysisChart(chartData) {
        const chartContainer = document.getElementById('risk_analysis_chart_container');
        if (chartContainer && window.Plotly) {
            const cfg = safeJSONParse(chartData);
            updateRiskAnalysisDescription(cfg); // 시나리오 업데이트 함수 호출
            Plotly.newPlot(chartContainer, cfg, {}, {
                responsive: true,
                displayModeBar: false,
            });
        }
    }

    function updateRiskAnalysisDescription(chartData) {
        const detailEl = document.querySelector('.risk_analysis_grid .risk_analysis_detail');
        const mainDescEl = document.querySelector('.risk_analysis_discription .description_main');
        const detailDescEl = document.querySelector('.risk_analysis_discription .description_detail');

        if (!detailEl || !mainDescEl || !detailDescEl) return;

        const values = chartData.data?.[0]?.r || [];
        const avgScore = values.reduce((sum, val) => sum + val, 0) / (values.length || 1);

        let riskLevelText, mainDescText, detailDescText;

        if (avgScore >= 75) {
            riskLevelText = "종합 위험도: 안정";
            mainDescText = "모든 금융 지표가 매우 안정적입니다.";
            detailDescText = "고객의 소득, 신용 상태, 부채 수준 등 모든 면에서 리스크가 매우 낮아 긍정적인 심사 결과가 예상됩니다.";
        } else if (avgScore >= 50) {
            riskLevelText = "종합 위험도: 양호";
            mainDescText = "전반적으로 양호하나 일부 지표에 대한 관리가 필요합니다.";
            detailDescText = "대부분의 지표가 안정적이지만, 일부 항목(예: 소득 대비 대출 비율)에서 약간의 리스크가 발견되었습니다. 추가적인 검토가 필요할 수 있습니다.";
        } else if (avgScore >= 30) {
            riskLevelText = "종합 위험도: 주의";
            mainDescText = "일부 지표에서 리스크가 발견되어 주의가 필요합니다.";
            detailDescText = "소득 안정성 또는 신용 이력 등 특정 지표에서 주의가 필요한 수준의 리스크가 확인되었습니다. 해당 항목에 대한 심층 분석이 필요합니다.";
        } else {
            riskLevelText = "종합 위험도: 위험";
            mainDescText = "다수의 지표에서 리스크가 높아 심사에 부정적 영향이 예상됩니다.";
            detailDescText = "전반적인 재무 상태가 불안정하며, 상환 능력에 대한 리스크가 높게 평가되었습니다. 대출 승인에 신중한 접근이 요구됩니다.";
        }

        detailEl.textContent = riskLevelText;
        mainDescEl.textContent = mainDescText;
        detailDescEl.innerHTML = `지표는 <strong>수입, 요청 대출금, 대출 금리, 수입 대비 대출률, 신용 점수</strong>의 5가지 축으로 구성되며, ${detailDescText}`;
    }

    function renderProgressChart(chartData) {
        const chartContainer = document.getElementById('progress_chart_container');
        if (chartContainer && window.Plotly) {
        const cfg = safeJSONParse(chartData);
        Plotly.newPlot('progress_chart_container', cfg.data, cfg.layout, {
            responsive: true,
            displayModeBar: false,
        });
        }
    }

    function updateFinancialIndicators(indicators) {
        const detailItems = resultsContent.querySelectorAll('.detail_section .detail_item');
        const keys = Object.keys(indicators);
        keys.forEach((key, idx) => {
        if (!detailItems[idx]) return;
        const value = indicators[key];
        const valueEl = detailItems[idx].querySelector('.detail_value');
        const fill = detailItems[idx].querySelector('.progress_fill');
        if (valueEl) valueEl.textContent = `${value}%`;
        if (fill) {
            fill.style.width = `${value}%`;
            const bar = fill.parentElement;
            bar.className = 'progress_bar';
            if (value >= 80) bar.classList.add('low_risk');
            else if (value >= 50) bar.classList.add('medium_risk');
            else bar.classList.add('high_risk');
        }
        });
    }

    function updateRiskMatrix(riskMatrix) {
        const riskItems = resultsContent.querySelectorAll('.risk_item');
        riskMatrix.forEach((risk, i) => {
        if (!riskItems[i]) return;
        riskItems[i].className = `risk_item ${risk.level}`;
        const riskLevel = risk.level === 'low' ? '낮음' : risk.level === 'medium' ? '중간' : '높음';
        riskItems[i].children[0].textContent = riskLevel;
        riskItems[i].children[1].textContent = risk.type;
        });
    }

    function updateAiReport(reportData, approvalStatus) {
        const summaryIcon = document.getElementById('ai_summary_icon');
        const summaryTitle = document.getElementById('ai_summary_title');
        const summaryDesc = document.getElementById('ai_summary_description');
        const analysisDetailsContainer = document.querySelector('.analysis_details');
        const recommendationsList = document.querySelector(
        '.analysis_recommendations .recommendation_section:nth-child(1) .recommendation_list'
        );
        const warningsList = document.querySelector(
        '.analysis_recommendations .recommendation_section:nth-child(2) .recommendation_list'
        );

        const isApproved = approvalStatus === 'approved';
        if (summaryIcon) summaryIcon.className = isApproved ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-triangle-fill';
        if (summaryTitle) summaryTitle.textContent = reportData.summary_title || '결과 요약';
        if (summaryDesc) summaryDesc.innerHTML = reportData.summary_description || '';

        if (analysisDetailsContainer && Array.isArray(reportData.analysis_details)) {
        const items = analysisDetailsContainer.querySelectorAll('.detail_item');
        reportData.analysis_details.forEach((d, i) => {
            if (!items[i]) return;
            items[i].querySelector('.detail_label').textContent = d.label || '';
            items[i].querySelector('.detail_value').textContent = d.value || '';
            items[i].querySelector('.detail_description').textContent = d.description || '';
        });
        }

        function updateList(listEl, items, isWarning = false) {
        if (!listEl) return;
        listEl.innerHTML = '';
        (items || []).forEach((t) => {
            const div = document.createElement('div');
            div.className = `recommendation_item ${isWarning ? 'warning' : ''}`;
            div.innerHTML = `<i class="bi ${isWarning ? 'bi-exclamation-circle' : 'bi-check-circle'}"></i><span>${t}</span>`;
            listEl.appendChild(div);
        });
        }

        updateList(recommendationsList, reportData.recommendations, false);
        updateList(warningsList, reportData.warnings, true);
    }

    function resetForm() {
        inputs.forEach((input) => (input.value = ''));
        currentCustomerData = null;
        // 전역 변수도 초기화
        window.currentCustomerData = null;

        if (firstRow) firstRow.style.display = 'flex';

        const customerInfoHeader = document.querySelector('.customer_info_header');
        const customerDisplayHeader = document.querySelector('.customer_display_header');
        if (customerInfoHeader) customerInfoHeader.style.display = 'flex';
        if (customerDisplayHeader) customerDisplayHeader.style.display = 'none';

        const inputGrid = document.querySelector('.input_grid');
        const bankerNotes = document.querySelector('.banker_notes');
        const customerCheckActions = document.querySelector('.customer_check_actions');
        if (inputGrid) inputGrid.style.display = 'flex';
        if (bankerNotes) bankerNotes.style.display = 'block';
        if (customerCheckActions) customerCheckActions.style.display = 'block';

        if (customerDisplayContent) customerDisplayContent.style.display = 'none';
        if (secondRow) secondRow.style.display = 'none';
        if (thirdRow) {
            thirdRow.style.display = 'none';
            console.log('third_row 숨김');
        }

        // 토글 버튼 다시 표시
        const assessmentTypeToggle = document.querySelector('.assessment_type_toggle');
        if (assessmentTypeToggle) {
            assessmentTypeToggle.style.display = 'flex';
        }

        hideResultsPage();
    }

    // ---------- 입력 포맷 ----------
    const loanAmountInput = document.getElementById('loan_amount');
    if (loanAmountInput) {
        loanAmountInput.addEventListener('input', function () {
        let value = this.value.replace(/[^0-9,]/g, '');
        const numeric = value.replace(/,/g, '');
        if (numeric && !isNaN(numeric)) this.value = parseInt(numeric, 10).toLocaleString() + '원';
        else if (value === '') this.value = '';
        
        // 에러 클래스 제거
        this.classList.remove('error');
        const errorElement = document.getElementById(this.id + '_error');
        if (errorElement) {
            errorElement.innerHTML = '';
        }
        });
        loanAmountInput.addEventListener('keypress', function (e) {
        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) e.preventDefault();
        });
    }

    const phoneInput = document.getElementById('customer_phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function () {
        let value = this.value.replace(/\D/g, '');
        if (value.length > 11) value = value.substring(0, 11);
        if (value.length >= 10) value = value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        else if (value.length >= 6) value = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        else if (value.length >= 3) value = value.replace(/(\d{3})(\d{3})/, '$1-$2');
        this.value = value;
        
        // 에러 클래스 제거
        this.classList.remove('error');
        const errorElement = document.getElementById(this.id + '_error');
        if (errorElement) {
            errorElement.innerHTML = '';
        }
        });
    }

    const rrnInput = document.getElementById('customer_rrn');
    if (rrnInput) {
        rrnInput.addEventListener('input', function () {
            let value = this.value.replace(/\D/g, '');
            
            // 개인/기업 모드에 따른 포맷팅
            if (currentAssessmentType === 'personal') {
                // 개인: 주민번호 포맷팅 (123456-1234567)
                if (value.length > 13) value = value.substring(0, 13);
                if (value.length >= 7) value = value.replace(/(\d{6})(\d{7})/, '$1-$2');
            } else if (currentAssessmentType === 'corporate') {
                // 기업: 사업자등록번호 포맷팅 (123-45-67890)
                if (value.length > 10) value = value.substring(0, 10);
                if (value.length >= 6) value = value.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
                else if (value.length >= 3) value = value.replace(/(\d{3})(\d{2})/, '$1-$2');
            }
            
            this.value = value;
            
            // 에러 클래스 제거
            this.classList.remove('error');
            const errorElement = document.getElementById(this.id + '_error');
            if (errorElement) {
                errorElement.innerHTML = '';
            }
        });
    }

    // customer_name input에 에러 제거 이벤트 리스너 추가
    const customerNameInput = document.getElementById('customer_name');
    if (customerNameInput) {
        customerNameInput.addEventListener('input', function () {
            // 에러 클래스 제거
            this.classList.remove('error');
            const errorElement = document.getElementById(this.id + '_error');
            if (errorElement) {
                errorElement.innerHTML = '';
            }
        });
    }

    // loan_period input에 에러 제거 이벤트 리스너 추가
    const loanPeriodInput = document.getElementById('loan_period');
    if (loanPeriodInput) {
        loanPeriodInput.addEventListener('input', function () {
            // 에러 클래스 제거
            this.classList.remove('error');
            const errorElement = document.getElementById(this.id + '_error');
            if (errorElement) {
                errorElement.innerHTML = '';
            }
        });
    }

    // loan_purpose select에 에러 제거 이벤트 리스너 추가
    const loanPurposeSelectForError = document.getElementById('loan_purpose');
    if (loanPurposeSelectForError) {
        loanPurposeSelectForError.addEventListener('change', function () {
            // 에러 클래스 제거
            this.classList.remove('error');
            const errorElement = document.getElementById(this.id + '_error');
            if (errorElement) {
                errorElement.innerHTML = '';
            }
        });
    }

    // loan_product select에 에러 제거 이벤트 리스너 추가
    const loanProductSelectForError = document.getElementById('loan_product');
    if (loanProductSelectForError) {
        loanProductSelectForError.addEventListener('change', function () {
            // 에러 클래스 제거
            this.classList.remove('error');
            const errorElement = document.getElementById(this.id + '_error');
            if (errorElement) {
                errorElement.innerHTML = '';
            }
        });
    }

    // ---------- 이벤트 바인딩 ----------
    console.log('=== 이벤트 바인딩 시작 ===');
    console.log('btnAssess:', btnAssess);
    console.log('btnReset:', btnReset);
    console.log('btnCheckCustomer:', btnCheckCustomer);
    console.log('loanPurposeSelect:', loanPurposeSelect);
    
    if (btnAssess) {
        btnAssess.addEventListener('click', () => validateForm() && performAssessment());
        console.log('✅ btnAssess 이벤트 리스너 추가됨');
    } else {
        console.log('❌ btnAssess 요소를 찾을 수 없음');
    }
    
    if (btnReset) {
        btnReset.addEventListener('click', resetForm);
        console.log('✅ btnReset 이벤트 리스너 추가됨');
    } else {
        console.log('❌ btnReset 요소를 찾을 수 없음');
    }
    
    if (btnCheckCustomer) {
        btnCheckCustomer.addEventListener('click', checkCustomerInfo);
        console.log('✅ btnCheckCustomer 이벤트 리스너 추가됨');
    } else {
        console.log('❌ btnCheckCustomer 요소를 찾을 수 없음');
    }
    
    if (loanPurposeSelect) {
        loanPurposeSelect.addEventListener('change', updateLoanProducts);
        console.log('✅ loanPurposeSelect 이벤트 리스너 추가됨');
    } else {
        console.log('❌ loanPurposeSelect 요소를 찾을 수 없음');
    }
    
    console.log('=== 이벤트 바인딩 완료 ===');
    
    // ---------- 보고서 생성 버튼 이벤트 바인딩 (중복 방지) ----------
    setTimeout(() => {
        const reportBtn = document.querySelector('.report_upload_section');
        if (reportBtn) {
            console.log('보고서 생성 버튼 바인딩 시도');
            
            // 기존 이벤트 리스너 제거 (중복 방지)
            reportBtn.removeEventListener('click', handleReportClick);
            
            // 새로운 이벤트 리스너 추가
            reportBtn.addEventListener('click', handleReportClick);
            console.log('보고서 생성 버튼 바인딩 완료');
        } else {
            console.log('보고서 생성 버튼을 찾을 수 없습니다');
        }
    }, 500);
    
    // 보고서 클릭 핸들러 함수 (중복 방지)
    function handleReportClick(e) {
        console.log('보고서 생성 버튼 클릭됨');
        e.preventDefault();
        e.stopPropagation();
        
        // 중복 실행 방지
        if (window.isGeneratingReport) {
            console.log('이미 보고서 생성 중입니다.');
            return;
        }
        
        window.isGeneratingReport = true;
        
        if (typeof window.createAndSaveReport === 'function') {
            console.log('createAndSaveReport 함수 호출');
            window.createAndSaveReport();
        } else {
            console.error('createAndSaveReport 함수가 없습니다');
            alert('보고서 생성 기능을 사용할 수 없습니다.');
        }
        
        // 플래그는 createAndSaveReport 함수에서 해제됨
    }
    
    // --- 개인/기업 폼 업데이트 함수 ---
    function updateFormForAssessmentType(type) {
        const customerNameInput = document.getElementById('customer_name');
        const customerRrnInput = document.getElementById('customer_rrn');
        const customerPhoneInput = document.getElementById('customer_phone');
        const customerNameLabel = document.querySelector('label[for="customer_name"]');
        const customerRrnLabel = document.querySelector('label[for="customer_rrn"]');
        const customerPhoneLabel = document.querySelector('label[for="customer_phone"]');
        
        if (type === 'personal') {
            console.log('개인 여신심사 모드로 전환');
            
            // 개인용 라벨로 변경
            if (customerNameLabel) customerNameLabel.textContent = '고객명';
            if (customerRrnLabel) customerRrnLabel.textContent = '주민번호';
            if (customerPhoneLabel) customerPhoneLabel.textContent = '연락처';
            
            // 개인용 플레이스홀더로 변경
            if (customerNameInput) customerNameInput.placeholder = '홍길동';
            if (customerRrnInput) {
                customerRrnInput.placeholder = '123456-1234567';
                customerRrnInput.maxLength = 14;
            }
            if (customerPhoneInput) {
                customerPhoneInput.placeholder = '010-1234-5678';
                customerPhoneInput.maxLength = 13;
            }
            
        } else if (type === 'corporate') {
            console.log('기업 여신심사 모드로 전환');
            
            // 기업용 라벨로 변경
            if (customerNameLabel) customerNameLabel.textContent = '기업명';
            if (customerRrnLabel) customerRrnLabel.textContent = '사업자등록번호';
            if (customerPhoneLabel) customerPhoneLabel.textContent = '대표자 연락처';
            
            // 기업용 플레이스홀더로 변경
            if (customerNameInput) customerNameInput.placeholder = 'KB국민은행';
            if (customerRrnInput) {
                customerRrnInput.placeholder = '123-45-67890';
                customerRrnInput.maxLength = 12;
            }
            if (customerPhoneInput) {
                customerPhoneInput.placeholder = '02-1234-5678';
                customerPhoneInput.maxLength = 13;
            }
        }
        
        // 입력값 초기화
        if (customerNameInput) customerNameInput.value = '';
        if (customerRrnInput) customerRrnInput.value = '';
        if (customerPhoneInput) customerPhoneInput.value = '';
        
        // 에러 메시지 초기화
        clearAllErrors();
    }
    
    // --- 개인/기업 토글 버튼 이벤트 ---
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            
            // 모든 버튼에서 active 클래스 제거
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            
            // 클릭된 버튼에 active 클래스 추가
            this.classList.add('active');
            
            // 현재 타입 업데이트
            currentAssessmentType = type;
            
            console.log('평가 타입 변경:', type);
            
            // 타입에 따른 UI 변경
            updateFormForAssessmentType(type);
        });
    });
    
    // 페이지 로드 시 기본값 설정
    updateFormForAssessmentType('personal');
    
    console.log('=== 추가 이벤트 바인딩 완료 ===');
    });
