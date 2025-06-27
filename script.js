// Set today's date as default
document.getElementById('contractDate').value = new Date().toISOString().split('T')[0];

// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const body = document.body;
    const themeText = document.getElementById('themeText');
    const themeIcon = document.querySelector('.theme-icon path');
    
    if (savedTheme === 'dark') {
        body.classList.add('dark');
        themeText.textContent = 'Dark';
        themeIcon.setAttribute('d', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
    } else {
        body.classList.remove('dark');
        themeText.textContent = 'Light';
        themeIcon.setAttribute('d', 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z');
    }
}

function toggleTheme() {
    const body = document.body;
    const themeText = document.getElementById('themeText');
    const themeIcon = document.querySelector('.theme-icon path');
    
    body.classList.toggle('dark');
    
    if (body.classList.contains('dark')) {
        themeText.textContent = 'Dark';
        themeIcon.setAttribute('d', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
        localStorage.setItem('theme', 'dark');
    } else {
        themeText.textContent = 'Light';
        themeIcon.setAttribute('d', 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z');
        localStorage.setItem('theme', 'light');
    }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', initializeTheme);

// Format name from UPPERCASE to proper case
function formatName(name) {
    if (!name) return '';
    
    return name
        .toLowerCase()
        .split(' ')
        .map(word => {
            // Handle Czech titles and prepositions
            const lowerCaseWords = ['von', 'van', 'de', 'da', 'du', 'el', 'la'];
            const upperCaseWords = ['jr', 'sr', 'ii', 'iii', 'iv'];
            
            if (lowerCaseWords.includes(word)) {
                return word.toLowerCase();
            } else if (upperCaseWords.includes(word)) {
                return word.toUpperCase();
            } else {
                return word.charAt(0).toUpperCase() + word.slice(1);
            }
        })
        .join(' ');
}

// Global formatDate function for EU date formatting (DD-MM-YYYY)
function formatDate(dateStr) {
    if (!dateStr) return '';
    
    // Parse the date string properly to avoid timezone issues
    const dateParts = dateStr.split('-');
    if (dateParts.length === 3) {
        // Create date from components to avoid timezone offset issues
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(dateParts[2], 10);
        const date = new Date(year, month, day);
        
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        
        return `${dd}-${mm}-${yyyy}`;
    }
    
    // Fallback for other formats
    const date = new Date(dateStr);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    
    return `${dd}-${mm}-${yyyy}`;
}

// Helper function to format date for storage (Y-m-d format for backend compatibility)
function formatDateForStorage(date) {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

function addTimelineItem() {
    const container = document.getElementById('timelineContainer');
    const existingItems = container.querySelectorAll('.timeline-item');
    
    // Calculate start date for new phase (day after last phase ends)
    let nextStartDate = '';
    if (existingItems.length > 0) {
        const lastItem = existingItems[existingItems.length - 1];
        const lastEndDateInput = lastItem.querySelector('input[name="timelineEnd[]"]');
        if (lastEndDateInput && lastEndDateInput.value) {
            // Parse date properly to avoid timezone issues
            const dateParts = lastEndDateInput.value.split('-');
            const lastEndDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
            lastEndDate.setDate(lastEndDate.getDate() + 1);
            nextStartDate = formatDateForStorage(lastEndDate);
        }
    }
    
    const timelineItem = document.createElement('div');
    timelineItem.className = 'timeline-item';
    timelineItem.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Phase Name</label>
                <input class="form-input" type="text" name="timelinePhase[]" placeholder="Phase name" required>
            </div>
            <div class="form-group">
                <label class="form-label">Date Range</label>
                <input
                    class="form-input date-range-picker"
                    type="text"
                    name="timelineRange[]"
                    placeholder="Select date range"
                    required
                    style="min-width: 220px;"
                />
                <input type="hidden" name="timelineStart[]" value="${nextStartDate}">
                <input type="hidden" name="timelineEnd[]" value="">
            </div>
            <div class="form-group" style="display: flex; align-items: end;">
                <button type="button" class="btn btn-destructive btn-sm" onclick="removeTimelineItem(this)">Remove</button>
            </div>
        </div>
    `;
    container.appendChild(timelineItem);
    
    // Initialize date range picker for the new item
    initializeDateRangePicker(timelineItem.querySelector('.date-range-picker'), nextStartDate);
}

function removeTimelineItem(button) {
    const timelineItem = button.closest('.timeline-item');
    timelineItem.remove();
    
    // Recalculate subsequent phase start dates
    updatePhaseSequence();
    
    showToast('Phase removed successfully', 'success');
}

function initializeDateRangePicker(input, defaultStartDate = '') {
    if (!input) return;
    
    const startDateInput = input.parentElement.querySelector('input[name="timelineStart[]"]');
    const endDateInput = input.parentElement.querySelector('input[name="timelineEnd[]"]');
    
    // Set initial values if provided
    if (defaultStartDate && startDateInput) {
        startDateInput.value = defaultStartDate;
    }
    
    const startDate = startDateInput ? startDateInput.value : defaultStartDate;
    const endDate = endDateInput ? endDateInput.value : '';
    
    // Initialize display value
    if (startDate && endDate) {
        input.value = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    
    // Check if flatpickr is available
    if (typeof flatpickr === 'undefined') {
        console.error('Flatpickr is not loaded!');
        return;
    }
    
    try {
        const fp = flatpickr(input, {
            mode: "range",
            dateFormat: "d-m-Y",
            altInput: true,
            altFormat: "d-m-Y",
            defaultDate: startDate && endDate ? [startDate, endDate] : startDate ? [startDate] : [],
            minDate: startDate || "today",
            allowInput: false,
            clickOpens: true,
            disableMobile: false,
            parseDate: function(datestr, format) {
                // Handle both Y-m-d and d-m-Y formats
                if (datestr.includes('-')) {
                    const parts = datestr.split('-');
                    if (parts.length === 3) {
                        if (parts[0].length === 4) {
                            // Y-m-d format
                            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                        } else {
                            // d-m-Y format
                            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                        }
                    }
                }
                return new Date(datestr);
            },
            onChange: function(selectedDates, dateStr, instance) {
                // Only update if this is a user interaction with 2 dates selected
                if (selectedDates.length === 2) {
                    // Use local date methods to avoid timezone issues
                    const start = formatDateForStorage(selectedDates[0]);
                    const end = formatDateForStorage(selectedDates[1]);
                    
                    if (startDateInput) startDateInput.value = start;
                    if (endDateInput) endDateInput.value = end;
                    
                    const displayValue = `${formatDate(start)} - ${formatDate(end)}`;
                    input.value = displayValue;
                    
                    // Store the value to prevent it from disappearing
                    input.setAttribute('data-value', displayValue);
                    
                    // Update subsequent phases only after user completes selection
                    setTimeout(() => updatePhaseSequence(), 100);
                }
            },
            onClose: function(selectedDates, dateStr, instance) {
                // Ensure value persists after closing
                if (selectedDates.length === 2) {
                    const start = formatDateForStorage(selectedDates[0]);
                    const end = formatDateForStorage(selectedDates[1]);
                    const displayValue = `${formatDate(start)} - ${formatDate(end)}`;
                    input.value = displayValue;
                    input.setAttribute('data-value', displayValue);
                }
            },
            onReady: function(selectedDates, dateStr, instance) {
                // Apply dark mode styles if needed
                if (document.documentElement.getAttribute('data-theme') === 'dark') {
                    instance.calendarContainer.classList.add('flatpickr-dark');
                }
                
                // Restore value if it exists
                const storedValue = input.getAttribute('data-value');
                if (storedValue && !input.value) {
                    input.value = storedValue;
                }
            }
        });
        
        // Store reference to flatpickr instance
        input._flatpickr = fp;
        
        return fp;
    } catch (error) {
        console.error('Error creating flatpickr instance:', error);
        return null;
    }
}

function initializeSingleDatePicker(input, defaultDate = '') {
    if (!input) return;
    
    // Check if flatpickr is available
    if (typeof flatpickr === 'undefined') {
        console.error('Flatpickr is not loaded!');
        return;
    }
    
    try {
        const fp = flatpickr(input, {
            dateFormat: "d-m-Y",
            altInput: true,
            altFormat: "d-m-Y",
            defaultDate: defaultDate || input.value || '',
            minDate: "today",
            allowInput: false,
            clickOpens: true,
            disableMobile: false,
            parseDate: function(datestr, format) {
                // Handle both Y-m-d and d-m-Y formats
                if (datestr.includes('-')) {
                    const parts = datestr.split('-');
                    if (parts.length === 3) {
                        if (parts[0].length === 4) {
                            // Y-m-d format
                            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                        } else {
                            // d-m-Y format
                            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                        }
                    }
                }
                return new Date(datestr);
            },
            onChange: function(selectedDates, dateStr, instance) {
                if (selectedDates.length === 1) {
                    const selectedDate = formatDateForStorage(selectedDates[0]);
                    input.value = selectedDate;
                    
                    // Store the value to prevent it from disappearing
                    input.setAttribute('data-value', selectedDate);
                }
            },
            onClose: function(selectedDates, dateStr, instance) {
                // Ensure value persists after closing
                if (selectedDates.length === 1) {
                    const selectedDate = formatDateForStorage(selectedDates[0]);
                    input.value = selectedDate;
                    input.setAttribute('data-value', selectedDate);
                }
            },
            onReady: function(selectedDates, dateStr, instance) {
                // Apply dark mode styles if needed
                if (document.documentElement.getAttribute('data-theme') === 'dark') {
                    instance.calendarContainer.classList.add('flatpickr-dark');
                }
                
                // Restore value if it exists
                const storedValue = input.getAttribute('data-value');
                if (storedValue && !input.value) {
                    input.value = storedValue;
                }
            }
        });
        
        // Store reference to flatpickr instance
        input._flatpickr = fp;
        
        return fp;
    } catch (error) {
        console.error('Error creating single date flatpickr instance:', error);
        return null;
    }
}


function updatePhaseSequence() {
    const container = document.getElementById('timelineContainer');
    const timelineItems = container.querySelectorAll('.timeline-item');
    
    // Ensure first item always keeps its values
    const firstItem = timelineItems[0];
    if (firstItem) {
        const firstDateRangePicker = firstItem.querySelector('.date-range-picker');
        const firstStartInput = firstItem.querySelector('input[name="timelineStart[]"]');
        const firstEndInput = firstItem.querySelector('input[name="timelineEnd[]"]');
        
        // Preserve first item's display if it has values
        if (firstStartInput && firstEndInput && firstStartInput.value && firstEndInput.value) {
            if (firstDateRangePicker && !firstDateRangePicker.value) {
                firstDateRangePicker.value = `${formatDate(firstStartInput.value)} - ${formatDate(firstEndInput.value)}`;
            }
        }
    }
    
    timelineItems.forEach((item, index) => {
        if (index === 0) return; // Skip first item completely
        
        const prevItem = timelineItems[index - 1];
        const prevEndDateInput = prevItem.querySelector('input[name="timelineEnd[]"]');
        const currentStartDateInput = item.querySelector('input[name="timelineStart[]"]');
        const currentDateRangePicker = item.querySelector('.date-range-picker');
        
        if (prevEndDateInput && prevEndDateInput.value) {
            // Parse date properly to avoid timezone issues
            const dateParts = prevEndDateInput.value.split('-');
            const prevEndDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
            prevEndDate.setDate(prevEndDate.getDate() + 1);
            const newStartDate = formatDateForStorage(prevEndDate);
            
            // Only update if different to avoid infinite loops
            if (currentStartDateInput && currentStartDateInput.value !== newStartDate) {
                currentStartDateInput.value = newStartDate;
                
                // Update flatpickr minDate and default start date
                if (currentDateRangePicker && currentDateRangePicker._flatpickr) {
                    currentDateRangePicker._flatpickr.set('minDate', newStartDate);
                    
                    // If current phase has an end date, update the display
                    const currentEndDateInput = item.querySelector('input[name="timelineEnd[]"]');
                    if (currentEndDateInput && currentEndDateInput.value) {
                        currentDateRangePicker.value = `${formatDate(newStartDate)} - ${formatDate(currentEndDateInput.value)}`;
                        currentDateRangePicker._flatpickr.setDate([newStartDate, currentEndDateInput.value], false);
                    } else {
                        // Just set the start date
                        currentDateRangePicker._flatpickr.setDate([newStartDate], false);
                    }
                }
            }
        }
    });
}


function showToast(message, type = 'info') {
    const backgroundColor = type === 'success' ? '#10b981' : 
                          type === 'error' ? '#ef4444' : 
                          type === 'warning' ? '#f59e0b' : '#3b82f6';
    
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: {
            background: backgroundColor,
            borderRadius: "8px",
            fontFamily: "var(--font-sans)",
        },
        stopOnFocus: true,
    }).showToast();
}

function generatePreview() {
    const formData = new FormData(document.getElementById('contractForm'));
    const data = {};
    
    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
        if (key.includes('[]')) {
            const cleanKey = key.replace('[]', '');
            if (!data[cleanKey]) data[cleanKey] = [];
            data[cleanKey].push(value);
        } else {
            data[key] = value;
        }
    }

    const contractContent = generateContractContent(data);
    
    document.getElementById('previewContent').innerHTML = contractContent;
    document.getElementById('preview').classList.remove('hidden');
    
    // Scroll to preview
    document.getElementById('preview').scrollIntoView({ behavior: 'smooth' });
}

// Convert number to Czech words
function numberToCzechWords(num) {
    const ones = ["", "jeden", "dva", "tři", "čtyři", "pět", "šest", "sedm", "osm", "devět"];
    const teens = ["deset", "jedenáct", "dvanáct", "třináct", "čtrnáct", "patnáct", "šestnáct", "sedmnáct", "osmnáct", "devatenáct"];
    const tens = ["", "", "dvacet", "třicet", "čtyřicet", "padesát", "šedesát", "sedmdesát", "osmdesát", "devadesát"];
    const hundreds = ["", "sto", "dvěstě", "třista", "čtyřista", "pětset", "šestset", "sedmset", "osmset", "devětset"];

    if (num === 0) return "nula";
    if (num >= 1000000) return num.toString(); // fallback for very large numbers

    let result = "";
    
    // Thousands
    if (num >= 1000) {
        const thousand = Math.floor(num / 1000);
        if (thousand === 1) {
            result += "tisíc ";
        } else if (thousand < 5) {
            result += numberToCzechWords(thousand) + " tisíce ";
        } else {
            result += numberToCzechWords(thousand) + " tisíc ";
        }
        num = num % 1000;
    }

    // Hundreds
    if (num >= 100) {
        result += hundreds[Math.floor(num / 100)] + " ";
        num = num % 100;
    }

    // Tens and ones
    if (num >= 20) {
        result += tens[Math.floor(num / 10)];
        if (num % 10 !== 0) {
            result += " " + ones[num % 10];
        }
    } else if (num >= 10) {
        result += teens[num - 10];
    } else if (num > 0) {
        result += ones[num];
    }

    return result.trim();
}

function generateContractContent(data) {
    const advanceAmount = Math.round((data.projectPrice * data.advancePercent) / 100);
    const remainingAmount = data.projectPrice - advanceAmount;
    const priceInWords = numberToCzechWords(data.projectPrice);
    
    // Format numbers with Czech formatting
    const formatCZK = (amount) => {
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',- Kč';
    };

    // Format date to Czech format
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('cs-CZ');
    };

    // Generate timeline table
    let timelineTable = '';
    if (data.timelinePhase && data.timelineStart && data.timelineEnd) {
        timelineTable = `
        <table border="1" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
                <th style="padding: 10px; background-color: #f0f0f0;">Fáze projektu</th>
                <th style="padding: 10px; background-color: #f0f0f0;">Datum zahájení</th>
                <th style="padding: 10px; background-color: #f0f0f0;">Datum ukončení</th>
            </tr>`;
        
        for (let i = 0; i < data.timelinePhase.length; i++) {
            timelineTable += `
            <tr>
                <td style="padding: 10px;">${data.timelinePhase[i]}</td>
                <td style="padding: 10px;">${formatDate(data.timelineStart[i])}</td>
                <td style="padding: 10px;">${formatDate(data.timelineEnd[i])}</td>
            </tr>`;
        }
        timelineTable += '</table>';
    }

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px;">
            <h1><strong>Smlouva o dílo č. ${data.contractNumber}</strong></h1>

            <h2><strong>Smluvní strany</strong></h2>
            
            <p><strong>Zhotovitel:</strong> Flex Digital Agency, s.r.o.</p>
            <ul>
                <li>Sídlo: Mattoniho nábřeží 50, Karlovy Vary 360 01</li>
                <li>IČO: 08894892</li>
                <li>Jednatel: Elchin Huseynli</li>
                <li>Bankovní spojení: Raiffeisenbank, a.s.</li>
                <li>Číslo účtu: 2096701002/5500</li>
            </ul>

            <p><strong>Objednatel:</strong> ${data.clientCompany}</p>
            <ul>
                <li>Sídlo: ${data.clientAddress}</li>
                <li>IČO: ${data.clientICO}</li>
                ${data.clientDIC ? `<li>DIČ (DPH): ${data.clientDIC}</li>` : ''}
                <li>Jednatel: ${data.clientRepresentative}</li>
                ${data.clientEmail ? `<li>Email: ${data.clientEmail}</li>` : ''}
                ${data.clientPhone ? `<li>Telefon: ${data.clientPhone}</li>` : ''}
            </ul>

            <p>Uzavřely podle ust. § 2586 a násl. zákona č. 89/2012 Sb., občanský zákoník, ve znění pozdějších předpisů a s odkazem na ust. § 61 zák. č. 121/2000 Sb., autorský zákon, ve znění pozdějších předpisů níže uvedeného dne, měsíce a roku tuto smlouvu o dílo:</p>

            <h2><strong>I. Předmět smlouvy</strong></h2>
            <p>1. Předmětem této smlouvy je závazek zhotovitele k provedení díla specifikovaného v této smlouvě a v příloze č. 1, která je její nedílnou součástí na náklady a nebezpečí zhotovitele ve sjednaném čase (dále jen „dílo"), a závazek objednatele zaplatit zhotoviteli za řádné a včasné provedení díla sjednanou cenu díla.</p>
            <p>2. Zhotovitel se zavazuje k provedení díla pro objednatele, a to v kvalitě a v rozsahu tak, jak je podrobně specifikováno v příloze A této smlouvy.</p>
            <p>3. Zhotovitel potvrzuje, že se seznámil s rozsahem a povahou díla, že jsou mu známy veškeré technické, kvalitativní a jiné podmínky nezbytné k realizaci díla, že disponuje takovými kapacitami a odbornými znalostmi, které jsou k provedení díla nezbytné.</p>

            <h2><strong>II. Doba plnění</strong></h2>
            <p>1. Zhotovitel se zavazuje celé dílo popsané v této smlouvě a v příloze A provést nejpozději do <strong>${formatDate(data.completionDate)}</strong>. Podrobný harmonogram je uveden v příloze C, která je nedílnou součástí této smlouvy.</p>
            <p>2. Lhůta splnění závazku zhotovitele se staví a neběží pro překážky, které nejsou na straně zhotovitele, a to po dobu trvání této překážky. Překážkou ve smyslu tohoto článku této smlouvy se rozumí zejména: a. neposkytnutí řádné součinnosti objednatele zhotoviteli k provádění díla, b. okolnosti vis maior.</p>

            <h2><strong>III. Práva a povinnosti smluvních stran</strong></h2>
            <p>1. Zhotovitel je povinen provést dílo dle pokynů objednatele, dokumentace předané objednatelem zhotoviteli a v souladu s obecně závaznými právními předpisy.</p>
            <p>2. Zhotovitel se zavazuje opatřit vše, co je zapotřebí k provedení díla podle této smlouvy.</p>
            <p>3. Zhotovitel se zavazuje spolupůsobit při výkonu finanční kontroly ve smyslu zákona č. 320/2001 Sb., o finanční kontrole ve veřejné správě a o změně některých zákonů, ve znění pozdějších předpisů, resp. zákona č. 255/2012 Sb., o kontrole.</p>
            <p>4. Objednatel se zavazuje poskytnout zhotoviteli veškerou součinnost potřebnou pro řádné plnění předmětu této smlouvy spočívající mj. v odsouhlasení grafických návrhů, poskytnutí technických požadavků na systém či součinnosti při předání díla. Objednatel je povinen poskytnout součinnost do 7 dnů ode dne doručení žádosti zhotovitele. Prodlení objednatele s poskytnutím uvedené součinnosti má za následek prodloužení termínu plnění díla o dobu, po kterou byl objednatel v prodlení s poskytnutím součinnosti.</p>
            <p>5. Zhotovitel je povinen upozornit objednatele bez zbytečného odkladu na nevhodnou povahu podkladů převzatých od objednatele nebo požadavků, připomínek a pokynů daných mu objednatelem k plnění předmětu této smlouvy.</p>
            <p>6. Smluvní strany navzájem jsou si povinny poskytnout veškerou součinnost potřebnou k provedení díla.</p>
            <p>7. Objednatel je oprávněn v průběhu provádění díla kontrolovat průběžný postup prací na díle. Zhotovitel je povinen na výzvu objednatele tuto součinnost umožnit.</p>
            <p>8. Účastníci této smlouvy výslovně prohlašují, že si navzájem sdělili všechny skutkové a právní okolnosti, o nichž k datu podpisu této smlouvy věděli nebo vědět museli, a které jsou relevantní ve vztahu k uzavření této smlouvy a naplnění jejího účelu.</p>

            <h2><strong>IV. Převzetí a předání díla</strong></h2>
            <p>1. Dnem řádného předání předmětu díla se rozumí den zveřejnění předmětu díla objednateli v kvalitě a rozsahu odpovídajícím této smlouvě.</p>
            <p>2. V případě řádně provedeného díla jsou smluvní strany povinny sepsat o předání a převzetí předmětu díla předávací protokol, který bude datován a podepsán oběma smluvními stranami.</p>
            <p>3. V případě zjištění vad díla je objednatel povinen tyto vady písemně vytknout v předávacím protokolu. Smluvní strany si v předávacím protokolu dohodnou termín pro odstranění vad. V případě, že objednatel nevytkne vady v době předání, dílo se považuje za řádně a včas předané bez vad a nedodělků.</p>
            <p>4. Osobou oprávněnou k převzetí díla za objednatele je <strong>${data.clientContactPerson}</strong>${data.clientContactEmail ? ` (email: ${data.clientContactEmail})` : ''}</p>
            <p>5. Osobou oprávněnou k předání díla za zhotovitele je <strong>Elchin Huseynli</strong>.</p>
            <p>6. Místem převzetí díla jsou <strong>${data.contractLocation}, Česká republika</strong>.</p>

            <h2><strong>V. Vlastnické právo a nebezpečí škody na díle</strong></h2>
            <p>1. Vlastníkem díla je až do okamžiku jeho předání objednateli zhotovitel.</p>
            <p>2. Nebezpečí škody na zhotoveném díle nese od uzavření smlouvy do doby předání řádně provedeného díla zhotovitel. Objednatel nese nebezpečí škody na zhotoveném díle ode dne, kdy převezme dílo, nebo ode dne, kdy je v prodlení s převzetím díla.</p>

            <h2><strong>VI. Cena za dílo a platební podmínky</strong></h2>
            <p>1. Objednatel se zavazuje za dílo zaplatit celkovou smluvní cenu ve výši <strong>${formatCZK(data.projectPrice)} (slovy: ${priceInWords} korun českých)</strong>. Zhotovitel není plátcem DPH.</p>
            <p>2. Cena dle předchozího odstavce obsahuje veškeré náklady pro realizaci díla včetně nákladů souvisejících. Kalkulace ceny je uvedena v příloze B, která je nedílnou součásti této smlouvy.</p>
            <p>3. Cena za dílo je pevná po celou dobu realizace díla a zahrnuje veškeré náklady zhotovitele související s realizací díla. Cena za dílo je stanovena jako nejvýše přípustná. Cena za dílo je překročitelná pouze v případě, dojde-li v průběhu realizace ke změně daňových předpisů s dopadem na cenu díla. Objednatel jiné překročení ceny díla nepřipouští.</p>
            <p>4. Objednatel je povinen zaplatit zálohu ve výši <strong>${data.advancePercent} %</strong> z ceny díla, které je předmětem podle této smlouvy. Tuto zálohu uhradí na účet zhotovitele číslo 2096701002/5500 do tří dnů od podpisu této smlouvy.</p>
            <p>5. Zbývající část ceny díla, které je předmětem podle této smlouvy uhradí objednatel na účet zhotovitele číslo 2096701002/5500 při předání zhotoveného díla. Objednatel se zavazuje faktury zaplatit ve splatnosti dle specifikace na fakturách (obvykle do 10 pracovních dnů).</p>
            <p>6. Faktury musí obsahovat všechny náležitosti řádného daňového a účetního dokladu ve smyslu příslušných právních předpisů, zejména zákona č. 563/1991 Sb., o účetnictví, ve znění pozdějších předpisů. Faktura nesplňující předepsané náležitosti bude objednatelem vrácena do dne její splatnosti k doplnění či opravě, aniž se tak dostane do prodlení se splatností. Lhůta splatnosti počíná běžet znovu od opětovného doručení náležitě doplněné či opravené faktury objednateli.</p>

            <h2><strong>VII. Odpovědnost za vady díla</strong></h2>
            <p>1. Dílo má vady, pokud není zhotoveno v souladu s podmínkami stanovenými touto smlouvou a jejími přílohami.</p>
            <p>2. Objednatel je povinen uplatnit vady u zhotovitele, a to písemně na adresu uvedenou v záhlaví této smlouvy s uvedením vytýkaných vad. Lhůta k odstranění vady se stanovuje na 30 kalendářních dní od doručení oznámení o výskytu vady zhotoviteli, pokud nebude smluvními stranami dohodnuto jinak. Zhotovitel je povinen odstranit vytknuté vady na svůj náklad.</p>
            <p>3. Zhotovitel dává záruku za jakost díla. Záruční doba je stanovena na <strong>${data.warrantyMonths} měsíců</strong>.</p>
            <p>4. Záruční doba počíná běžet dnem předání díla, případně dnem odstranění poslední vady a nedodělku vyplývajícího z protokolu o předání a převzetí díla. Po tuto dobu zhotovitel odpovídá za vady, které se na díle vyskytnou.</p>

            <h2><strong>VIII. Odstoupení od smlouvy</strong></h2>
            <p>1. Tato smlouva může být ukončena písemnou dohodou smluvních stran anebo odstoupením od smlouvy z důvodů stanovených v této smlouvě nebo v zákoně.</p>
            <p>2. Od této smlouvy může smluvní strana odstoupit pro podstatné porušení smluvní povinnosti druhou smluvní stranou. Za podstatné porušení smluvní povinnosti se považuje zejména: a. na straně objednatele nezaplacení ceny díla podle této smlouvy ve lhůtě delší než 10 dní po dni splatnosti příslušné faktury, b. na straně zhotovitele, jestliže dílo (nebo jeho část), nebude řádně dodáno v dohodnutém termínu, c. na straně zhotovitele, jestliže dílo nebude mít vlastnosti deklarované zhotovitelem v této smlouvě či vlastnosti z této smlouvy vyplývající, d. na straně zhotovitele, jestliže je zhotovitel v prodlení s odstraněním vad dle čl. VII. této smlouvy.</p>
            <p>3. Odstoupení od této smlouvy musí být učiněno písemně a jako takové doručeno druhé straně na v záhlaví uvedenou adresu či do datové schránky.</p>
            <p>4. V případě odstoupení od této smlouvy jsou smluvní strany povinny vypořádat své vzájemné závazky a pohledávky stanovené v zákoně nebo v této smlouvě, a to do 30 dnů od právních účinků odstoupení, nebo v dohodnuté lhůtě.</p>

            <h2><strong>IX. Ochrana informací</strong></h2>
            <p>1. Smluvní strany se vzájemně zavazují, že budou chránit a utajovat před třetími osobami chráněné informace, dokumenty a skutečnosti, tvořící obchodní tajemství, které byly vzájemně stranami poskytnuty v rámci tohoto obchodního případu. Obchodní tajemství tvoří konkurenčně významné, určitelné, ocenitelné a v příslušných obchodních kruzích běžně nedostupné skutečnosti, jejichž vlastník zajišťuje ve svém zájmu odpovídajícím způsobem jejich utajení.</p>

            <h2><strong>X. Smluvní pokuty a náhrada škody</strong></h2>
            <p>1. Jestliže zhotovitel bude v prodlení s provedením jím zhotovovaného díla, je objednatel oprávněn požadovat po zhotoviteli smluvní pokutu ve výši 0,05 % z celkové ceny díla za každý den prodlení.</p>
            <p>2. Bude-li objednatel v prodlení se zaplacením ceny díla, je zhotovitel oprávněn požadovat po objednateli smluvní pokutu ve výši 0,05 % z neuhrazené části peněžitého závazku, a to za každý den prodlení.</p>
            <p>3. Poruší-li smluvní strana povinnost uvedenou v ust. čl. IX. odst. 1) této smlouvy, je povinna zaplatit smluvní pokutu ve výši 3 000,- Kč za každé takové prokázané porušení.</p>
            <p>4. Ujednáním o smluvní pokutě není dotčeno právo objednatele nebo zhotovitele na náhradu škody způsobené porušením povinnosti, na kterou se smluvní pokuta vztahuje, a to ani v případě, že náhrada škody přesahuje smluvní pokutu.</p>
            <p>5. Smluvní pokuta je splatná do 30 dnů od data, kdy byla povinné straně doručena písemná výzva k jejímu zaplacení ze strany oprávněné, a to na účet oprávněné strany uvedený v písemné výzvě.</p>
            <p>6. Smluvní strany se dohodly, že se právo na náhradu škody, s výjimkou škody způsobené úmyslně, omezuje částkou rovnající se celkové dohodnuté ceně díla. Hradí se pouze přímé škody, žádná ze smluvních stran nemá nárok na náhradu za žádné jiné škody, včetně následných škod, ušlého zisku a zvláštních, nepřímých nebo náhodných škod.</p>

            <p><strong>XI. Licenční ujednání</strong></p>
            <p>1. Zhotovitel poskytuje objednateli licenci ke všem způsobům užití díla (rozmnožování díla, rozšiřování díla, pronájem díla, půjčování díla, vystavování díla a sdělování díla veřejnosti), v rozsahu neomezeném, a to jak ve hmotné, tak i v nehmotné podobě, zejména pak elektronicky.</p>
            <p>2. Objednatel není povinen licenci využít.</p>
            <p>3. Objednatel je oprávněn využívat dílo výdělečně nebo nevýdělečně.</p>
            <p>4. Objednatel je oprávněn oprávnění tvořící součást licence zcela nebo zčásti poskytnout či postoupit třetí osobě. Objednatel je oprávněn postoupit licenci kterékoli osobě. Objednatel není povinen zhotovitele, ani autora informovat o poskytnutí podlicence ani o postoupení licence.</p>
            <p>5. Smluvní strany výslovně sjednávají, že cena licence je již zahrnuta v ceně díla dle čl. VI. této smlouvy.</p>
            <p>6. Územní rozsah licence není omezen. Licence se poskytuje na dobu trvání majetkových práv k dílu. Množstevní rozsah licence je neomezený.</p>
            <p>7. Zhotovitel uděluje nabyvateli souhlas ke zveřejňování, úpravám, zpracování díla včetně jeho překladu, spojování s jiným dílem, jakož i užití takto zpracovaného díla, zařazení díla do díla souborného a užití tohoto souborného díla. Zhotovitel dále uděluje nabyvateli souhlas k úpravám či změně názvu díla.</p>
            <p>8. Zhotovitel prohlašuje, že je oprávněn poskytnout objednateli práva k dílu dle této smlouvy. Zhotovitel je povinen vypořádat veškeré nároky autora ve vztahu k dílu dle této smlouvy.</p>
            <p>9. Zhotovitel je oprávněn uvádět jméno objednatele a ukázky z díla, včetně jeho charakteristik, jako svoji referenci pro účely vlastní propagace. Zhotovitel má právo umístit na dílo svoje označení autorství, přičemž to bude zároveň sloužit jako odkaz na jeho webové stránky. Zhotovitel se zavazuje nenarušit tímto celkový vzhled díla.</p>

            <h2><strong>XII. Závěrečná ustanovení</strong></h2>
            <p>1. Ustanovení této smlouvy lze doplňovat, měnit nebo rušit pouze písemnými, vzestupně číslovanými a datovanými dodatky podepsanými oprávněnými zástupci obou smluvních stran, a to na návrh kterékoli z nich.</p>
            <p>2. Pro vztahy touto smlouvou výslovně neupravené, včetně náhrady škody, platí příslušná ustanovení zákona č. 89/2012 Sb., občanský zákoník ve znění pozdějších předpisů.</p>
            <p>3. V případě, že některé ustanovení této smlouvy je nebo se stane neúčinným, zůstávají ostatní ustanovení této smlouvy účinná. Smluvní strany se zavazují nahradit neúčinné ustanovení této smlouvy ustanovením jiným, účinným, které svým obsahem a smyslem odpovídá nejlépe obsahu a smyslu ustanovení původního.</p>
            <p>4. Případné spory vzniklé z této smlouvy budou řešeny podle platné právní úpravy věcně a místně příslušnými orgány České republiky.</p>
            <p>5. Tato smlouva je vyhotovena ve dvou stejnopisech, z nichž každý má platnost originálu, přičemž každá smluvní strana obdrží jedno vyhotovení.</p>
            <p>6. Obě smluvní strany prohlašují, že si smlouvu přečetly a s jejím obsahem, který vyjadřuje jejich pravou vůli prostou omylů, souhlasí. Zároveň prohlašují, že tato smlouva není uzavírána v tísni nebo za nápadně nevýhodných podmínek, na důkaz čehož připojují své podpisy.</p>
            <p>7. Tato smlouva nabývá platnosti dnem jejího uzavření, tj. dnem podpisu smlouvy oprávněnými zástupci obou smluvních stran.</p>

            <table border="1" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 10px;">V ${data.contractLocation}, dne</td>
                    <td style="padding: 10px;"></td>
                </tr>
                <tr>
                    <td style="padding: 10px;"><strong>Objednatel:</strong></td>
                    <td style="padding: 10px;"></td>
                </tr>
                <tr>
                    <td style="padding: 10px;">V ${data.contractLocation}, dne</td>
                    <td style="padding: 10px;">${formatDate(data.contractDate)}</td>
                </tr>
                <tr>
                    <td style="padding: 10px;"><strong>Zhotovitel:</strong></td>
                    <td style="padding: 10px;"></td>
                </tr>
            </table>

            <div style="page-break-before: always;"></div>

            <h2><strong>Příloha A – Popis díla</strong></h2>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
                <pre style="white-space: pre-wrap; font-family: inherit;">${data.projectDescription}</pre>
            </div>

            <p>Všechny části díla budou vytvořeny s ohledem na moderní trendy v designu a budou respektovat požadavky klienta na barevnost a celkový vizuální styl. Grafické návrhy budou optimalizovány pro různá zobrazovací zařízení, přičemž uspořádání obsahu a velikost prvků se budou přizpůsobovat šířce zobrazení.</p>

            <p>Součástí díla je také konzultace s klientem ohledně jeho požadavků a preferencí, prezentace návrhů a případné revize až do finálního schválení.</p>

            <p><strong>Dílo nezahrnuje:</strong></p>
            <ul>
                <li>Dodání fotografií, videí nebo jiných multimediálních materiálů</li>
                <li>Dlouhodobou správu webových stránek</li>
                <li>Dodatečné úpravy po schválení finálních verzí, pokud nejsou způsobeny chybou dodavatele</li>
            </ul>

            <p>Veškeré potřebné podklady a informace pro tvorbu díla dodá objednatel.</p>

            <div style="page-break-before: always;"></div>

            <h2><strong>Příloha B – kalkulace ceny díla</strong></h2>
            <table border="1" style="width: 100%; border-collapse: collapse;">
                <tr>
                    <th style="padding: 10px; background-color: #f0f0f0;">Název položky</th>
                    <th style="padding: 10px; background-color: #f0f0f0;">Cena</th>
                </tr>
                <tr>
                    <td style="padding: 10px;">Tvorba webových stránek</td>
                    <td style="padding: 10px;">${formatCZK(data.projectPrice)}</td>
                </tr>
                <tr style="font-weight: bold;">
                    <td style="padding: 10px;"><strong>Cena celkem:</strong></td>
                    <td style="padding: 10px;">${formatCZK(data.projectPrice)}</td>
                </tr>
            </table>

            <div style="page-break-before: always;"></div>

            <h2><strong>Příloha C – časový harmonogram zhotovení díla</strong></h2>
            ${timelineTable}
        </div>
    `;
}

async function generateMarkdown() {
    const formData = new FormData(document.getElementById('contractForm'));
    const data = {};
    
    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
        if (key.includes('[]')) {
            const cleanKey = key.replace('[]', '');
            if (!data[cleanKey]) data[cleanKey] = [];
            data[cleanKey].push(value);
        } else {
            data[key] = value;
        }
    }

    try {
        const response = await fetch('/api/generate-markdown', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            
            // Create and download markdown file
            const blob = new Blob([result.content], { type: 'text/markdown' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showToast('Markdown contract downloaded successfully!', 'success');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate markdown');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error generating markdown: ' + error.message, 'error');
    }
}

function downloadContract() {
    const formData = new FormData(document.getElementById('contractForm'));
    const data = {};
    
    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
        if (key.includes('[]')) {
            const cleanKey = key.replace('[]', '');
            if (!data[cleanKey]) data[cleanKey] = [];
            data[cleanKey].push(value);
        } else {
            data[key] = value;
        }
    }

    const contractContent = generateContractContent(data);
    
    // Create HTML file with proper styling
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Smlouva o dílo ${data.contractNumber}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1, h2, h3 { color: #333; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f0f0f0; }
            .signature-section { margin-top: 60px; display: flex; justify-content: space-between; }
            .signature-line { border-bottom: 1px solid #000; width: 200px; margin-top: 40px; }
            @media print { body { margin: 0; padding: 15px; } }
        </style>
    </head>
    <body>
        ${contractContent}
    </body>
    </html>`;
    
    // Create download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Smlouva_${data.contractNumber}_${data.clientCompany.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Contract downloaded as HTML file! You can open it in any browser and print or save as PDF.', 'success');
}

async function loadFromARES() {
    const icoInput = document.getElementById('clientICO');
    const ico = icoInput.value.trim();
    
    if (!ico) {
        showToast('Prosím zadejte IČO', 'warning');
        return;
    }
    
    // Show loading state
    const button = event.target;
    const loadingText = button.querySelector('.loading-text');
    const originalText = loadingText.textContent;
    loadingText.innerHTML = '<span class="loading-spinner"></span>Loading...';
    button.disabled = true;
    
    try {
        const response = await fetch(`/api/ares/${ico}`);
        const result = await response.json();
        
        if (result.success) {
            // Fill the form fields
            if (result.data.name) {
                document.getElementById('clientCompany').value = result.data.name;
            }
            if (result.data.address) {
                document.getElementById('clientAddress').value = result.data.address;
            }
            if (result.data.dic) {
                document.getElementById('clientDIC').value = result.data.dic;
            }
            if (result.data.representative) {
                const formattedName = formatName(result.data.representative);
                document.getElementById('clientRepresentative').value = formattedName;
                // Also set as default contact person for handover
                document.getElementById('clientContactPerson').value = formattedName;
            }
            
            showToast('Data byla úspěšně načtena z ARES', 'success');
        } else {
            showToast(result.error || 'Nepodařilo se načíst data z ARES', 'error');
        }
    } catch (error) {
        console.error('Error loading from ARES:', error);
        showToast('Chyba při načítání dat z ARES: ' + error.message, 'error');
    } finally {
        // Reset button state
        loadingText.textContent = originalText;
        button.disabled = false;
    }
}

async function copyMarkdownToClipboard() {
    const formData = new FormData(document.getElementById('contractForm'));
    const data = {};
    
    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
        if (key.includes('[]')) {
            const cleanKey = key.replace('[]', '');
            if (!data[cleanKey]) data[cleanKey] = [];
            data[cleanKey].push(value);
        } else {
            data[key] = value;
        }
    }

    try {
        const response = await fetch('/api/generate-markdown', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            
            // Copy markdown content to clipboard
            navigator.clipboard.writeText(result.content).then(() => {
                showToast('Markdown contract copied to clipboard! You can paste it into any text editor or markdown-compatible application.', 'success');
            }).catch(err => {
                console.error('Failed to copy markdown: ', err);
                showToast('Failed to copy markdown. Please try the download option instead.', 'error');
            });
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate markdown');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error generating markdown: ' + error.message, 'error');
    }
}

function copyToClipboard() {
    const formData = new FormData(document.getElementById('contractForm'));
    const data = {};
    
    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
        if (key.includes('[]')) {
            const cleanKey = key.replace('[]', '');
            if (!data[cleanKey]) data[cleanKey] = [];
            data[cleanKey].push(value);
        } else {
            data[key] = value;
        }
    }

    // Generate plain text version
    const advanceAmount = Math.round((data.projectPrice * data.advancePercent) / 100);
    const remainingAmount = data.projectPrice - advanceAmount;
    
    const formatCZK = (amount) => {
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',- Kč';
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('cs-CZ');
    };

    let timelineText = '';
    if (data.timelinePhase && data.timelineStart && data.timelineEnd) {
        timelineText = '\n\n[PAGE BREAK]\n\nPříloha C – časový harmonogram zhotovení díla\n\n';
        for (let i = 0; i < data.timelinePhase.length; i++) {
            timelineText += `${data.timelinePhase[i]}: ${formatDate(data.timelineStart[i])} - ${formatDate(data.timelineEnd[i])}\n`;
        }
    }

    const priceInWords = numberToCzechWords(data.projectPrice);

    const textContent = `
Smlouva o dílo č. ${data.contractNumber}

Smluvní strany

Zhotovitel: Flex Digital Agency, s.r.o.

• Sídlo: Mattoniho nábřeží 50, Karlovy Vary 360 01
• IČO: 08894892
• Jednatel: Elchin Huseynli
• Bankovní spojení: Raiffeisenbank, a.s.
• Číslo účtu: 2096701002/5500

Objednatel: ${data.clientCompany}

• Sídlo: ${data.clientAddress}
• IČO: ${data.clientICO}
${data.clientDIC ? `• DIČ (DPH): ${data.clientDIC}` : ''}
• Jednatel: ${data.clientRepresentative}
${data.clientEmail ? `• Email: ${data.clientEmail}` : ''}
${data.clientPhone ? `• Telefon: ${data.clientPhone}` : ''}

Uzavřely podle ust. § 2586 a násl. zákona č. 89/2012 Sb., občanský zákoník, ve znění pozdějších předpisů a s odkazem na ust. § 61 zák. č. 121/2000 Sb., autorský zákon, ve znění pozdějších předpisů níže uvedeného dne, měsíce a roku tuto smlouvu o dílo:

I. Předmět smlouvy

1. Předmětem této smlouvy je závazek zhotovitele k provedení díla specifikovaného v této smlouvě a v příloze č. 1, která je její nedílnou součástí na náklady a nebezpečí zhotovitele ve sjednaném čase (dále jen „dílo"), a závazek objednatele zaplatit zhotoviteli za řádné a včasné provedení díla sjednanou cenu díla.
2. Zhotovitel se zavazuje k provedení díla pro objednatele, a to v kvalitě a v rozsahu tak, jak je podrobně specifikováno v příloze A této smlouvy.
3. Zhotovitel potvrzuje, že se seznámil s rozsahem a povahou díla, že jsou mu známy veškeré technické, kvalitativní a jiné podmínky nezbytné k realizaci díla, že disponuje takovými kapacitami a odbornými znalostmi, které jsou k provedení díla nezbytné.

II. Doba plnění

1. Zhotovitel se zavazuje celé dílo popsané v této smlouvě a v příloze A provést nejpozději do ${formatDate(data.completionDate)}. Podrobný harmonogram je uveden v příloze C, která je nedílnou součástí této smlouvy.
2. Lhůta splnění závazku zhotovitele se staví a neběží pro překážky, které nejsou na straně zhotovitele, a to po dobu trvání této překážky. Překážkou ve smyslu tohoto článku této smlouvy se rozumí zejména: a. neposkytnutí řádné součinnosti objednatele zhotoviteli k provádění díla, b. okolnosti vis maior.

III. Práva a povinnosti smluvních stran

1. Zhotovitel je povinen provést dílo dle pokynů objednatele, dokumentace předané objednatelem zhotoviteli a v souladu s obecně závaznými právními předpisy.
2. Zhotovitel se zavazuje opatřit vše, co je zapotřebí k provedení díla podle této smlouvy.
3. Zhotovitel se zavazuje spolupůsobit při výkonu finanční kontroly ve smyslu zákona č. 320/2001 Sb., o finanční kontrole ve veřejné správě a o změně některých zákonů, ve znění pozdějších předpisů, resp. zákona č. 255/2012 Sb., o kontrole.
4. Objednatel se zavazuje poskytnout zhotoviteli veškerou součinnost potřebnou pro řádné plnění předmětu této smlouvy spočívající mj. v odsouhlasení grafických návrhů, poskytnutí technických požadavků na systém či součinnosti při předání díla. Objednatel je povinen poskytnout součinnost do 7 dnů ode dne doručení žádosti zhotovitele. Prodlení objednatele s poskytnutím uvedené součinnosti má za následek prodloužení termínu plnění díla o dobu, po kterou byl objednatel v prodlení s poskytnutím součinnosti.
5. Zhotovitel je povinen upozornit objednatele bez zbytečného odkladu na nevhodnou povahu podkladů převzatých od objednatele nebo požadavků, připomínek a pokynů daných mu objednatelem k plnění předmětu této smlouvy.
6. Smluvní strany navzájem jsou si povinny poskytnout veškerou součinnost potřebnou k provedení díla.
7. Objednatel je oprávněn v průběhu provádění díla kontrolovat průběžný postup prací na díle. Zhotovitel je povinen na výzvu objednatele tuto součinnost umožnit.
8. Účastníci této smlouvy výslovně prohlašují, že si navzájem sdělili všechny skutkové a právní okolnosti, o nichž k datu podpisu této smlouvy věděli nebo vědět museli, a které jsou relevantní ve vztahu k uzavření této smlouvy a naplnění jejího účelu.

IV. Převzetí a předání díla

1. Dnem řádného předání předmětu díla se rozumí den zveřejnění předmětu díla objednateli v kvalitě a rozsahu odpovídajícím této smlouvě.
2. V případě řádně provedeného díla jsou smluvní strany povinny sepsat o předání a převzetí předmětu díla předávací protokol, který bude datován a podepsán oběma smluvními stranami.
3. V případě zjištění vad díla je objednatel povinen tyto vady písemně vytknout v předávacím protokolu. Smluvní strany si v předávacím protokolu dohodnou termín pro odstranění vad. V případě, že objednatel nevytkne vady v době předání, dílo se považuje za řádně a včas předané bez vad a nedodělků.
4. Osobou oprávněnou k převzetí díla za objednatele je ${data.clientContactPerson}${data.clientContactEmail ? ` (email: ${data.clientContactEmail})` : ''}
5. Osobou oprávněnou k předání díla za zhotovitele je Elchin Huseynli.
6. Místem převzetí díla jsou ${data.contractLocation}, Česká republika.

V. Vlastnické právo a nebezpečí škody na díle

1. Vlastníkem díla je až do okamžiku jeho předání objednateli zhotovitel.
2. Nebezpečí škody na zhotoveném díle nese od uzavření smlouvy do doby předání řádně provedeného díla zhotovitel. Objednatel nese nebezpečí škody na zhotoveném díle ode dne, kdy převezme dílo, nebo ode dne, kdy je v prodlení s převzetím díla.

VI. Cena za dílo a platební podmínky

1. Objednatel se zavazuje za dílo zaplatit celkovou smluvní cenu ve výši ${formatCZK(data.projectPrice)} (slovy: ${priceInWords} korun českých). Zhotovitel není plátcem DPH.
2. Cena dle předchozího odstavce obsahuje veškeré náklady pro realizaci díla včetně nákladů souvisejících. Kalkulace ceny je uvedena v příloze B, která je nedílnou součásti této smlouvy.
3. Cena za dílo je pevná po celou dobu realizace díla a zahrnuje veškeré náklady zhotovitele související s realizací díla. Cena za dílo je stanovena jako nejvýše přípustná. Cena za dílo je překročitelná pouze v případě, dojde-li v průběhu realizace ke změně daňových předpisů s dopadem na cenu díla. Objednatel jiné překročení ceny díla nepřipouští.
4. Objednatel je povinen zaplatit zálohu ve výši ${data.advancePercent} % z ceny díla, které je předmětem podle této smlouvy. Tuto zálohu uhradí na účet zhotovitele číslo 2096701002/5500 do tří dnů od podpisu této smlouvy.
5. Zbývající část ceny díla, které je předmětem podle této smlouvy uhradí objednatel na účet zhotovitele číslo 2096701002/5500 při předání zhotoveného díla. Objednatel se zavazuje faktury zaplatit ve splatnosti dle specifikace na fakturách (obvykle do 10 pracovních dnů).
6. Faktury musí obsahovat všechny náležitosti řádného daňového a účetního dokladu ve smyslu příslušných právních předpisů, zejména zákona č. 563/1991 Sb., o účetnictví, ve znění pozdějších předpisů. Faktura nesplňující předepsané náležitosti bude objednatelem vrácena do dne její splatnosti k doplnění či opravě, aniž se tak dostane do prodlení se splatností. Lhůta splatnosti počíná běžet znovu od opětovného doručení náležitě doplněné či opravené faktury objednateli.

VII. Odpovědnost za vady díla

1. Dílo má vady, pokud není zhotoveno v souladu s podmínkami stanovenými touto smlouvou a jejími přílohami.
2. Objednatel je povinen uplatnit vady u zhotovitele, a to písemně na adresu uvedenou v záhlaví této smlouvy s uvedením vytýkaných vad. Lhůta k odstranění vady se stanovuje na 30 kalendářních dní od doručení oznámení o výskytu vady zhotoviteli, pokud nebude smluvními stranami dohodnuto jinak. Zhotovitel je povinen odstranit vytknuté vady na svůj náklad.
3. Zhotovitel dává záruku za jakost díla. Záruční doba je stanovena na ${data.warrantyMonths} měsíců.
4. Záruční doba počíná běžet dnem předání díla, případně dnem odstranění poslední vady a nedodělku vyplývajícího z protokolu o předání a převzetí díla. Po tuto dobu zhotovitel odpovídá za vady, které se na díle vyskytnou.

VIII. Odstoupení od smlouvy

1. Tato smlouva může být ukončena písemnou dohodou smluvních stran anebo odstoupením od smlouvy z důvodů stanovených v této smlouvě nebo v zákoně.
2. Od této smlouvy může smluvní strana odstoupit pro podstatné porušení smluvní povinnosti druhou smluvní stranou. Za podstatné porušení smluvní povinnosti se považuje zejména: a. na straně objednatele nezaplacení ceny díla podle této smlouvy ve lhůtě delší než 10 dní po dni splatnosti příslušné faktury, b. na straně zhotovitele, jestliže dílo (nebo jeho část), nebude řádně dodáno v dohodnutém termínu, c. na straně zhotovitele, jestliže dílo nebude mít vlastnosti deklarované zhotovitelem v této smlouvě či vlastnosti z této smlouvy vyplývající, d. na straně zhotovitele, jestliže je zhotovitel v prodlení s odstraněním vad dle čl. VII. této smlouvy.
3. Odstoupení od této smlouvy musí být učiněno písemně a jako takové doručeno druhé straně na v záhlaví uvedenou adresu či do datové schránky.
4. V případě odstoupení od této smlouvy jsou smluvní strany povinny vypořádat své vzájemné závazky a pohledávky stanovené v zákoně nebo v této smlouvě, a to do 30 dnů od právních účinků odstoupení, nebo v dohodnuté lhůtě.

IX. Ochrana informací

1. Smluvní strany se vzájemně zavazují, že budou chránit a utajovat před třetími osobami chráněné informace, dokumenty a skutečnosti, tvořící obchodní tajemství, které byly vzájemně stranami poskytnuty v rámci tohoto obchodního případu. Obchodní tajemství tvoří konkurenčně významné, určitelné, ocenitelné a v příslušných obchodních kruzích běžně nedostupné skutečnosti, jejichž vlastník zajišťuje ve svém zájmu odpovídajícím způsobem jejich utajení.

X. Smluvní pokuty a náhrada škody

1. Jestliže zhotovitel bude v prodlení s provedením jím zhotovovaného díla, je objednatel oprávněn požadovat po zhotoviteli smluvní pokutu ve výši 0,05 % z celkové ceny díla za každý den prodlení.
2. Bude-li objednatel v prodlení se zaplacením ceny díla, je zhotovitel oprávněn požadovat po objednateli smluvní pokutu ve výši 0,05 % z neuhrazené části peněžitého závazku, a to za každý den prodlení.
3. Poruší-li smluvní strana povinnost uvedenou v ust. čl. IX. odst. 1) této smlouvy, je povinna zaplatit smluvní pokutu ve výši 3 000,- Kč za každé takové prokázané porušení.
4. Ujednáním o smluvní pokutě není dotčeno právo objednatele nebo zhotovitele na náhradu škody způsobené porušením povinnosti, na kterou se smluvní pokuta vztahuje, a to ani v případě, že náhrada škody přesahuje smluvní pokutu.
5. Smluvní pokuta je splatná do 30 dnů od data, kdy byla povinné straně doručena písemná výzva k jejímu zaplacení ze strany oprávněné, a to na účet oprávněné strany uvedený v písemné výzvě.
6. Smluvní strany se dohodly, že se právo na náhradu škody, s výjimkou škody způsobené úmyslně, omezuje částkou rovnající se celkové dohodnuté ceně díla. Hradí se pouze přímé škody, žádná ze smluvních stran nemá nárok na náhradu za žádné jiné škody, včetně následných škod, ušlého zisku a zvláštních, nepřímých nebo náhodných škod.

XI. Licenční ujednání

1. Zhotovitel poskytuje objednateli licenci ke všem způsobům užití díla (rozmnožování díla, rozšiřování díla, pronájem díla, půjčování díla, vystavování díla a sdělování díla veřejnosti), v rozsahu neomezeném, a to jak ve hmotné, tak i v nehmotné podobě, zejména pak elektronicky.
2. Objednatel není povinen licenci využít.
3. Objednatel je oprávněn využívat dílo výdělečně nebo nevýdělečně.
4. Objednatel je oprávněn oprávnění tvořící součást licence zcela nebo zčásti poskytnout či postoupit třetí osobě. Objednatel je oprávněn postoupit licenci kterékoli osobě. Objednatel není povinen zhotovitele, ani autora informovat o poskytnutí podlicence ani o postoupení licence.
5. Smluvní strany výslovně sjednávají, že cena licence je již zahrnuta v ceně díla dle čl. VI. této smlouvy.
6. Územní rozsah licence není omezen. Licence se poskytuje na dobu trvání majetkových práv k dílu. Množstevní rozsah licence je neomezený.
7. Zhotovitel uděluje nabyvateli souhlas ke zveřejňování, úpravám, zpracování díla včetně jeho překladu, spojování s jiným dílem, jakož i užití takto zpracovaného díla, zařazení díla do díla souborného a užití tohoto souborného díla. Zhotovitel dále uděluje nabyvateli souhlas k úpravám či změně názvu díla.
8. Zhotovitel prohlašuje, že je oprávněn poskytnout objednateli práva k dílu dle této smlouvy. Zhotovitel je povinen vypořádat veškeré nároky autora ve vztahu k dílu dle této smlouvy.
9. Zhotovitel je oprávněn uvádět jméno objednatele a ukázky z díla, včetně jeho charakteristik, jako svoji referenci pro účely vlastní propagace. Zhotovitel má právo umístit na dílo svoje označení autorství, přičemž to bude zároveň sloužit jako odkaz na jeho webové stránky. Zhotovitel se zavazuje nenarušit tímto celkový vzhled díla.

XII. Závěrečná ustanovení

1. Ustanovení této smlouvy lze doplňovat, měnit nebo rušit pouze písemnými, vzestupně číslovanými a datovanými dodatky podepsanými oprávněnými zástupci obou smluvních stran, a to na návrh kterékoli z nich.
2. Pro vztahy touto smlouvou výslovně neupravené, včetně náhrady škody, platí příslušná ustanovení zákona č. 89/2012 Sb., občanský zákoník ve znění pozdějších předpisů.
3. V případě, že některé ustanovení této smlouvy je nebo se stane neúčinným, zůstávají ostatní ustanovení této smlouvy účinná. Smluvní strany se zavazují nahradit neúčinné ustanovení této smlouvy ustanovením jiným, účinným, které svým obsahem a smyslem odpovídá nejlépe obsahu a smyslu ustanovení původního.
4. Případné spory vzniklé z této smlouvy budou řešeny podle platné právní úpravy věcně a místně příslušnými orgány České republiky.
5. Tato smlouva je vyhotovena ve dvou stejnopisech, z nichž každý má platnost originálu, přičemž každá smluvní strana obdrží jedno vyhotovení.
6. Obě smluvní strany prohlašují, že si smlouvu přečetly a s jejím obsahem, který vyjadřuje jejich pravou vůli prostou omylů, souhlasí. Zároveň prohlašují, že tato smlouva není uzavírána v tísni nebo za nápadně nevýhodných podmínek, na důkaz čehož připojují své podpisy.
7. Tato smlouva nabývá platnosti dnem jejího uzavření, tj. dnem podpisu smlouvy oprávněnými zástupci obou smluvních stran.

V ${data.contractLocation}, dne ${formatDate(data.contractDate)}

Objednatel: ________________________     Zhotovitel: ________________________
${data.clientRepresentative}                           Elchin Huseynli

[PAGE BREAK]

Příloha A – Popis díla

${data.projectDescription}

Všechny části díla budou vytvořeny s ohledem na moderní trendy v designu a budou respektovat požadavky klienta na barevnost a celkový vizuální styl. Grafické návrhy budou optimalizovány pro různá zobrazovací zařízení, přičemž uspořádání obsahu a velikost prvků se budou přizpůsobovat šířce zobrazení.

Součástí díla je také konzultace s klientem ohledně jeho požadavků a preferencí, prezentace návrhů a případné revize až do finálního schválení.

Dílo nezahrnuje:

* Dodání fotografií, videí nebo jiných multimediálních materiálů
* Dlouhodobou správu webových stránek
* Dodatečné úpravy po schválení finálních verzí, pokud nejsou způsobeny chybou dodavatele

Veškeré potřebné podklady a informace pro tvorbu díla dodá objednatel.

[PAGE BREAK]

Příloha B – kalkulace ceny díla

Tvorba webových stránek: ${formatCZK(data.projectPrice)}
Cena celkem: ${formatCZK(data.projectPrice)}
${timelineText}
    `.trim();

    navigator.clipboard.writeText(textContent).then(() => {
        showToast('Contract text copied to clipboard! You can paste it into Google Docs or any text editor.', 'success');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showToast('Failed to copy text. Please try the download option instead.', 'error');
    });
}

// Initialize timeline functionality when everything is loaded
window.addEventListener('load', function() {
    // Wait a bit more to ensure all external scripts are loaded
    setTimeout(function() {
        if (typeof flatpickr !== 'undefined') {
            initializeDefaultDates();
            initializeExistingTimelineItems();
        } else {
            console.error('Flatpickr library not loaded');
        }
    }, 1000);
});

function initializeDefaultDates() {
    // Set default dates
    const today = new Date();
    
    // Set completion date to 1 month from today if not set
    const completionDateInput = document.getElementById('completionDate');
    if (completionDateInput && !completionDateInput.value) {
        const completionDate = new Date(today);
        completionDate.setMonth(today.getMonth() + 1);
        const completionDateStr = formatDateForStorage(completionDate);
        completionDateInput.value = completionDateStr;
    }
    
    // Set contract date to today if not set
    const contractDateInput = document.getElementById('contractDate');
    if (contractDateInput && !contractDateInput.value) {
        contractDateInput.value = formatDateForStorage(today);
    }
    
    // Initialize all single date pickers
    initializeDatePickers();
}

function initializeDatePickers() {
    // Initialize all .flatpickr-date inputs as single date pickers
    const singleDateInputs = document.querySelectorAll('.flatpickr-date');
    
    singleDateInputs.forEach((input) => {
        if (!input._flatpickr) {
            initializeSingleDatePicker(input);
        }
    });
}

function initializeExistingTimelineItems() {
    const existingItems = document.querySelectorAll('.timeline-item');
    
    existingItems.forEach((item, index) => {
        const dateRangePicker = item.querySelector('.date-range-picker');
        const startDateInput = item.querySelector('input[name="timelineStart[]"]');
        const endDateInput = item.querySelector('input[name="timelineEnd[]"]');
        
        if (dateRangePicker && !dateRangePicker._flatpickr) {
            // Set default dates if not already set
            if (startDateInput && endDateInput && !startDateInput.value && !endDateInput.value) {
                // For first item, use today as start date
                if (index === 0) {
                    const today = new Date();
                    const startDate = formatDateForStorage(today);
                    
                    // Default end date is 2 weeks from start
                    const endDate = new Date(today);
                    endDate.setDate(today.getDate() + 14);
                    const endDateStr = formatDateForStorage(endDate);
                    
                    startDateInput.value = startDate;
                    endDateInput.value = endDateStr;
                }
            }
            
            // Set initial display value
            if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
                dateRangePicker.value = `${formatDate(startDateInput.value)} - ${formatDate(endDateInput.value)}`;
            }
            
            // Initialize date range picker
            initializeDateRangePicker(dateRangePicker);
        }
    });
}