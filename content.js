// Scrappbook Kommentar-Manager - Content Script
// Version 1.0

// Globale Variablen
let isTableView = false;
let allData = [];

// Warte bis Seite geladen
function init() {
    // Prüfe ob wir in einer Collection sind
    if (!window.location.hash.includes('/collection/edit/')) return;
    
    // Warte bis die Buttons geladen sind und füge unseren hinzu
    waitForElement('.sc-xwuxA.hIwPYH.col', addToggleButton);
}

// Warte auf Element
function waitForElement(selector, callback) {
    const element = document.querySelector(selector);
    if (element) {
        callback();
    } else {
        setTimeout(() => waitForElement(selector, callback), 500);
    }
}

// Button hinzufügen
function addToggleButton() {
    // Prüfe ob wir im Auswahlen-Tab sind
    const activeTab = document.querySelector('.tab-pane.active');
    if (!activeTab) {
        setTimeout(addToggleButton, 500);
        return;
    }
    
    // Prüfe ob es Auswahlen sind (nicht Bilder/Design/etc)
    const hasSelections = activeTab.querySelector('.selection-preview-wrapper');
    if (!hasSelections) {
        setTimeout(addToggleButton, 500);
        return;
    }
    
    // Finde die Button-Leiste
    const buttonContainer = document.querySelector('.sc-xwuxA.hIwPYH.col');
    if (!buttonContainer) {
        setTimeout(addToggleButton, 500);
        return;
    }
    
    // Prüfe ob Button schon existiert
    if (document.getElementById('scrappbook-table-toggle')) return;
    
    // Erstelle Toggle-Button (gleicher Style wie andere Buttons)
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'scrappbook-table-toggle';
    toggleBtn.className = 'sc-kDHTFB fwuoPL btn btn-primary btn-outline';
    toggleBtn.type = 'button';
    toggleBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 8px;">
            <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z"/>
        </svg>
        Tabellenansicht
    `;
    
    toggleBtn.addEventListener('click', toggleView);
    buttonContainer.appendChild(toggleBtn);
}

// Ansicht wechseln
async function toggleView() {
    const toggleBtn = document.getElementById('scrappbook-table-toggle');
    
    if (!isTableView) {
        // Zu Tabellenansicht wechseln
        toggleBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 8px;">
                <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z"/>
            </svg>
            Originalansicht
        `;
        
        // Daten laden und Tabelle anzeigen
        await loadDataAndShowTable();
        isTableView = true;
    } else {
        // Zurück zur Originalansicht
        toggleBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 8px;">
                <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z"/>
            </svg>
            Tabellenansicht
        `;
        
        hideTable();
        isTableView = false;
    }
}

// Collection ID finden
function getCollectionId() {
    // Aus der URL extrahieren: #/collection/edit/SkD6TBF1-g
    const match = window.location.hash.match(/\/collection\/edit\/([^\/]+)/);
    return match ? match[1] : null;
}

// Daten von API laden
async function loadDataAndShowTable() {
    const collectionId = getCollectionId();
    
    if (!collectionId) {
        alert('Collection ID konnte nicht gefunden werden!');
        return;
    }
    
    console.log('Collection ID:', collectionId);
    
    const apiUrl = `https://api.scrappbook.de/api/selections/collection?collection_id=${collectionId}`;
    
    try {
        const response = await fetch(apiUrl, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API Fehler: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Daten geladen:', data.length, 'Auswahlen');
        
        // Finde die Selection ID aus dem DOM - Format: <div id="selection_XXX">
        let selectionId = null;
        const selectionDivs = document.querySelectorAll('[id^="selection_"]');
        
        if (selectionDivs.length > 0) {
            // Filtere _lock divs raus und nimm das mit opacity: 1 (aktive Auswahl)
            for (let div of selectionDivs) {
                if (!div.id.includes('_lock')) {
                    const opacity = window.getComputedStyle(div).opacity;
                    if (opacity === '1') {
                        selectionId = div.id.replace('selection_', '');
                        console.log('✅ Aktive Selection ID gefunden:', selectionId, '(opacity: 1)');
                        break;
                    }
                }
            }
        }
        
        if (!selectionId) {
            console.error('Keine Selection ID im DOM gefunden');
            // Fallback: Nimm die erste Auswahl mit Bildern
            const firstSelection = data.find(sel => sel.favorites && sel.favorites.length > 0);
            if (firstSelection) {
                console.log('Fallback: Verwende erste Auswahl:', firstSelection.name);
                prepareAndShowData(firstSelection, data);
                return;
            } else {
                alert('Keine Auswahl mit Bildern gefunden!');
                return;
            }
        }
        
        // Finde die passende Auswahl in den API-Daten
        const currentSelection = data.find(sel => sel._id === selectionId);
        
        if (!currentSelection) {
            console.error('Selection ID', selectionId, 'nicht in API-Daten gefunden');
            console.log('Verfügbare Selections:', data.map(s => ({ id: s._id, name: s.name })));
            alert('Auswahl wurde in den API-Daten nicht gefunden!');
            return;
        }
        
        console.log('Auswahl gefunden:', currentSelection.name, 'mit', currentSelection.favorites.length, 'Bildern');
        
        prepareAndShowData(currentSelection, data);
        
    } catch (error) {
        console.error('Fehler beim Laden:', error);
        alert('Fehler beim Laden der Daten: ' + error.message);
    }
}

// Cache für geladene Bild-URLs
let imageCache = {};

// Daten vorbereiten und anzeigen
function prepareAndShowData(currentSelection, allSelections) {
    console.log('✅ Bereite Daten vor für:', currentSelection.name);
    
    // 1. Sammle ALLE jemals geladenen Bilder aus Performance API (Browser Cache)
    const cachedImageUrls = performance.getEntriesByType('resource')
        .filter(r => r.name.includes('photostore24.online') && r.name.includes('images'))
        .map(r => r.name);
    
    console.log(`🗂️ ${cachedImageUrls.length} Bilder im Browser-Cache gefunden`);
    
    // 2. Sammle aktuell sichtbare Bilder aus dem Grid
    const imageUrlMap = {};
    const visibleImages = document.querySelectorAll('[data-cy="wrapper"] img');
    
    visibleImages.forEach(img => {
        if (img.src) {
            // URL Format: .../userId/folder/IDENTIFIER/filename?token=...
            // Extrahiere identifier (vorletzter Teil vor filename)
            const match = img.src.match(/\/([^\/]+)\/[^\/]+\?token=/);
            if (match) {
                const identifier = match[1];
                imageUrlMap[identifier] = img.src;
            }
        }
    });
    
    // 3. Ergänze mit gecachten URLs
    cachedImageUrls.forEach(url => {
        const match = url.match(/\/([^\/]+)\/[^\/]+\?token=/);
        if (match) {
            const identifier = match[1];
            if (!imageUrlMap[identifier]) {
                imageUrlMap[identifier] = url;
            }
        }
    });
    
    console.log(`📸 ${Object.keys(imageUrlMap).length} Bilder verfügbar (Grid + Cache)`);
    console.log('Erste 3 Identifiers:', Object.keys(imageUrlMap).slice(0, 3));
    
    // 4. Prüfe Extension-Cache für diese Selection
    const cacheKey = currentSelection._id;
    if (imageCache[cacheKey]) {
        console.log('✅ Extension-Cache gefunden! Verwende gecachte Bilder');
        Object.assign(imageUrlMap, imageCache[cacheKey]);
    }
    
    allData = currentSelection.favorites.map(fav => {
        const imageName = fav._image.originalImageName;
        const identifier = fav._image.identifier;
        
        // Suche passendes Bild über identifier im URL-Mapping
        let thumbnail = imageUrlMap[identifier] || null;
        
        if (!thumbnail) {
            console.log(`⚠️ Kein Bild gefunden für identifier: ${identifier}`);
        }
        
        // Status aus API-Daten
        const hasHeart = !!fav.like;
        const hasComment = !!(fav.comment && fav.comment.trim());
        
        return {
            selectionName: currentSelection.name,
            imageName: imageName,
            imageId: fav._image._id,
            identifier: identifier,
            comment: fav.comment || '',
            thumbnail: thumbnail,
            fullImage: thumbnail ? thumbnail.replace('/XS.jpg', '/S.jpg') : null,
            hasHeart: hasHeart,
            hasComment: hasComment,
            imageObj: fav._image
        };
    });
    
    console.log(`✅ ${allData.length} Bilder vorbereitet (${allData.filter(d => d.thumbnail).length} mit URLs)`);
    showTable(allData);
}

// Tabelle anzeigen
function showTable(data) {
    // Original Grid-Container verstecken
    const originalContainer = document.querySelector('[data-testid="image-gallery-inner-container"]') ||
                            document.querySelector('.sc-cepDVR.eIOBQB') || 
                            document.querySelector('.autosizer') ||
                            document.querySelector('[style*="overflow: visible"]');
    
    if (originalContainer) {
        originalContainer.style.display = 'none';
    }
    
    // Finde die Button-Leiste (wo der Toggle-Button ist)
    const buttonContainer = document.querySelector('.sc-xwuxA.hIwPYH.col');
    if (!buttonContainer) {
        console.error('Button-Container nicht gefunden!');
        alert('Button-Container konnte nicht gefunden werden!');
        return;
    }
    
    // Finde den Parent des Button-Containers (dort fügen wir die Tabelle ein)
    const parentContainer = buttonContainer.parentElement;
    if (!parentContainer) {
        console.error('Parent-Container nicht gefunden!');
        alert('Parent-Container konnte nicht gefunden werden!');
        return;
    }
    
    // Tabellen-Container erstellen oder finden
    let tableContainer = document.getElementById('scrappbook-table-container');
    if (!tableContainer) {
        tableContainer = document.createElement('div');
        tableContainer.id = 'scrappbook-table-container';
        // Füge Container NACH dem Button-Container ein
        buttonContainer.parentNode.insertBefore(tableContainer, buttonContainer.nextSibling);
    }
    
    tableContainer.style.display = 'block';
    tableContainer.innerHTML = '';
    
    // Export-Button mit Dropdown ZUERST hinzufügen
    const exportContainer = document.createElement('div');
    exportContainer.style.cssText = 'margin-bottom: 20px; display: inline-flex; gap: 10px; align-items: center;';
    
    const exportBtn = document.createElement('button');
    exportBtn.className = 'scrappbook-export-btn';
    exportBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
        </svg>
        Exportieren
    `;
    
    const formatSelect = document.createElement('select');
    formatSelect.className = 'scrappbook-format-select';
    formatSelect.innerHTML = `
        <option value="csv">CSV (Excel)</option>
        <option value="md">Markdown</option>
        <option value="txt">Text</option>
    `;
    
    exportBtn.onclick = () => exportData(formatSelect.value);
    
    exportContainer.appendChild(exportBtn);
    exportContainer.appendChild(formatSelect);
    
    // "Alle Bilder laden" Button
    const loadedImages = data.filter(item => item.thumbnail).length;
    const missingImages = data.length - loadedImages;
    
    if (missingImages > 0) {
        const loadImagesBtn = document.createElement('button');
        loadImagesBtn.className = 'scrappbook-export-btn';
        loadImagesBtn.style.background = '#2196F3';
        loadImagesBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M.5 3.5A.5.5 0 0 1 1 3h14a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5H1a.5.5 0 0 1-.5-.5v-9zM1 4a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h6V4H1zm7 0v8h6a.5.5 0 0 0 .5-.5v-7A.5.5 0 0 0 14 4H8z"/>
                <path d="M10 5.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"/>
            </svg>
            Alle Bilder laden (${loadedImages}/${data.length})
        `;
        loadImagesBtn.onclick = async () => {
            // Lade alle Bilder Funktion inline
            const loadBtn = loadImagesBtn;
            
            // Button deaktivieren
            loadBtn.disabled = true;
            const originalBtnHtml = loadBtn.innerHTML;
            loadBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
                    <path d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
                </svg>
                Wechsle zur Original-Ansicht...
            `;
            
            try {
                console.log('🔄 Starte Bild-Lade-Prozess...');
                
                // 1. Zur Original-Ansicht wechseln
                const tableContainer = document.getElementById('scrappbook-table-container');
                const originalContainer = document.querySelector('[data-testid="image-gallery-inner-container"]') ||
                                         document.querySelector('[style*="overflow: visible"]');
                
                if (!originalContainer || !tableContainer) {
                    alert('Container nicht gefunden!');
                    loadBtn.disabled = false;
                    loadBtn.innerHTML = originalBtnHtml;
                    return;
                }
                
                // Verstecke Tabelle, zeige Grid
                tableContainer.style.display = 'none';
                originalContainer.style.display = 'block';
                
                await new Promise(r => setTimeout(r, 300)); // Warte bis Grid sichtbar
                
                // 2. Finde Grid-Container (den scrollbaren DIV)
                let gridContainer = null;
                
                // Finde scrollbaren Container
                const scrollables = Array.from(document.querySelectorAll('*')).filter(el => {
                    const style = window.getComputedStyle(el);
                    return (style.overflow === 'auto' || style.overflowY === 'auto') &&
                           el.scrollHeight > el.clientHeight;
                });
                
                // Nimm den zweiten scrollbaren Container (der mit den Bildern)
                if (scrollables.length >= 2) {
                    gridContainer = scrollables[1];
                } else if (scrollables.length === 1) {
                    gridContainer = scrollables[0];
                } else {
                    gridContainer = document.querySelector('.autosizer');
                }
                
                if (!gridContainer) {
                    console.error('❌ Grid-Container nicht gefunden!');
                    console.log('Verfügbare scrollable Container:', scrollables.length);
                    alert('Grid-Container nicht gefunden!');
                    tableContainer.style.display = 'block';
                    originalContainer.style.display = 'none';
                    loadBtn.disabled = false;
                    loadBtn.innerHTML = originalBtnHtml;
                    return;
                }
                
                console.log('✅ Grid-Container gefunden:', {
                    className: gridContainer.className,
                    scrollHeight: gridContainer.scrollHeight,
                    clientHeight: gridContainer.clientHeight,
                    scrollTop: gridContainer.scrollTop
                });
                
                loadBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
                        <path d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
                    </svg>
                    Scrolle durch Bilder...
                `;
                
                console.log('🔄 Starte Auto-Scroll im Grid...');
                
                const imageMap = {};
                let lastImageCount = 0;
                let noChangeCount = 0;
                const maxScrolls = 50;
                let scrollCount = 0;
                
                // 3. Scrolle durch das Grid
                while (scrollCount < maxScrolls && noChangeCount < 5) {
                    // Sammle aktuell sichtbare Bilder
                    const visibleImages = document.querySelectorAll('[data-cy="wrapper"] img');
                    visibleImages.forEach(img => {
                        if (img.src) {
                            // Extrahiere identifier (vorletzter Teil der URL)
                            const match = img.src.match(/\/([^\/]+)\/[^\/]+\?token=/);
                            if (match) {
                                const identifier = match[1];
                                imageMap[identifier] = img.src;
                            }
                        }
                    });
                    
                    const currentCount = Object.keys(imageMap).length;
                    console.log(`📸 Bilder geladen: ${currentCount}/${allData.length}`);
                    
                    // Update Button Text
                    loadBtn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
                            <path d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
                        </svg>
                        Lade ${currentCount}/${allData.length}...
                    `;
                    
                    // Prüfe ob neue Bilder geladen wurden
                    if (currentCount === lastImageCount) {
                        noChangeCount++;
                    } else {
                        noChangeCount = 0;
                        lastImageCount = currentCount;
                    }
                    
                    // Alle Bilder geladen?
                    if (currentCount >= allData.length) {
                        console.log('✅ Alle Bilder geladen!');
                        break;
                    }
                    
                    // Scrolle weiter
                    const oldScrollTop = gridContainer.scrollTop;
                    gridContainer.scrollTop += 300;
                    const newScrollTop = gridContainer.scrollTop;
                    
                    console.log(`🔄 Scroll: ${oldScrollTop} → ${newScrollTop} (${scrollCount + 1}/${maxScrolls})`);
                    
                    // Prüfe ob wir am Ende sind
                    if (oldScrollTop === newScrollTop && oldScrollTop > 0) {
                        console.log('⬇️ Scrolling am Ende angekommen');
                        noChangeCount++;
                    }
                    
                    scrollCount++;
                    
                    // Warte kurz damit Bilder laden können
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
                
                console.log(`✅ ${Object.keys(imageMap).length} Bilder gesammelt`);
                
                // 4. Speichere im Cache
                const selectionDivs = document.querySelectorAll('[id^="selection_"]');
                let selectionId = null;
                for (let div of selectionDivs) {
                    if (!div.id.includes('_lock')) {
                        const opacity = window.getComputedStyle(div).opacity;
                        if (opacity === '1') {
                            selectionId = div.id.replace('selection_', '');
                            break;
                        }
                    }
                }
                
                if (selectionId) {
                    imageCache[selectionId] = imageMap;
                    console.log('💾 Bilder im Extension-Cache gespeichert');
                }
                
                // 5. Scrolle zurück zum Anfang
                gridContainer.scrollTop = 0;
                
                loadBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
                        <path d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
                    </svg>
                    Zurück zur Tabelle...
                `;
                
                await new Promise(r => setTimeout(r, 300));
                
                // 6. Zurück zur Tabelle
                originalContainer.style.display = 'none';
                
                // 7. Tabelle neu laden mit allen Bildern
                await loadDataAndShowTable();
                
                console.log('✅ Fertig! Alle Bilder geladen.');
                
            } catch (error) {
                console.error('❌ Fehler beim Laden der Bilder:', error);
                alert('Fehler beim Laden der Bilder: ' + error.message);
                
                // Stelle sicher dass Tabelle wieder sichtbar ist
                const tableContainer = document.getElementById('scrappbook-table-container');
                const originalContainer = document.querySelector('[data-testid="image-gallery-inner-container"]') ||
                                         document.querySelector('[style*="overflow: visible"]');
                if (tableContainer) tableContainer.style.display = 'block';
                if (originalContainer) originalContainer.style.display = 'none';
                
                loadBtn.disabled = false;
                loadBtn.innerHTML = originalBtnHtml;
            }
        };
        exportContainer.appendChild(loadImagesBtn);
    }
    
    // Buttons-Container OBEN hinzufügen (vor der Tabelle)
    tableContainer.appendChild(exportContainer);
    
    // Tabelle erstellen (ohne extra Wrapper, direkt in tableContainer)
    const table = document.createElement('table');
    table.className = 'scrappbook-table';
    
    // Header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>#</th>
            <th class="sortable" data-sort="status">Status ↕</th>
            <th>Vorschau</th>
            <th class="sortable" data-sort="imageName">Bildname ↕</th>
            <th class="sortable" data-sort="comment">Kommentar ↕</th>
            <th>Download</th>
        </tr>
    `;
    
    // Sortier-Events
    thead.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => sortTable(th.dataset.sort));
    });
    
    table.appendChild(thead);
    
    // Body
    const tbody = document.createElement('tbody');
    data.forEach((item, index) => {
        const row = document.createElement('tr');
        
        // Zeilennummer
        const numberCell = document.createElement('td');
        numberCell.textContent = index + 1;
        numberCell.style.fontWeight = '600';
        numberCell.style.color = '#666';
        
        // Status-Zelle mit Icons
        const statusCell = document.createElement('td');
        statusCell.style.textAlign = 'center';
        statusCell.style.fontSize = '18px';
        
        let statusIcons = '';
        if (item.hasHeart && item.hasComment) {
            statusIcons = '❤️💬';
            statusCell.title = 'Favorisiert & Kommentiert';
        } else if (item.hasHeart) {
            statusIcons = '❤️';
            statusCell.title = 'Favorisiert';
        } else if (item.hasComment) {
            statusIcons = '💬';
            statusCell.title = 'Kommentiert';
        } else {
            statusIcons = '-';
            statusCell.title = 'Kein Status';
        }
        statusCell.textContent = statusIcons;
        
        // Thumbnail oder Platzhalter
        const thumbnailCell = document.createElement('td');
        thumbnailCell.style.textAlign = 'center';
        
        if (item.thumbnail) {
            // Bild vorhanden - zeige img
            const img = document.createElement('img');
            img.src = item.thumbnail;
            img.alt = item.imageName;
            img.className = 'scrappbook-thumbnail';
            img.style.width = '80px';
            img.style.height = '80px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '4px';
            img.style.cursor = 'pointer';
            img.style.display = 'block';
            
            // Klick öffnet Vollbild - finde und klicke Original Fullscreen-Button
            img.addEventListener('click', () => {
                // Suche Fullscreen-Button ähnlich wie beim Download
                // 1. Finde das passende Bild-Wrapper-Element über data-cy="wrapper"
                const allWrappers = document.querySelectorAll('[data-cy="wrapper"]');
                let targetWrapper = null;
                
                for (const wrapper of allWrappers) {
                    const wrapperImg = wrapper.querySelector('img');
                    if (wrapperImg && wrapperImg.src === item.thumbnail) {
                        targetWrapper = wrapper;
                        break;
                    }
                }
                
                if (targetWrapper) {
                    // 2. Suche den Fullscreen-Button innerhalb dieses Wrappers
                    // Der Button ist oft ein ReactTooltip-Target mit data-for="fullscreen..."
                    const fullscreenBtn = targetWrapper.querySelector('[data-for*="fullscreen"]') ||
                                         targetWrapper.querySelector('button[title*="Vollbild"]') ||
                                         targetWrapper.querySelector('svg[data-icon="expand"]')?.closest('button');
                    
                    if (fullscreenBtn) {
                        fullscreenBtn.click();
                        console.log('✅ Fullscreen-Button geklickt');
                    } else {
                        console.log('⚠️ Fullscreen-Button nicht gefunden, öffne Fallback');
                        // Fallback: Öffne Bild in neuem Tab
                        window.open(item.fullImage, '_blank');
                    }
                } else {
                    console.log('⚠️ Wrapper nicht gefunden, öffne Fallback');
                    // Fallback: Öffne Bild in neuem Tab
                    window.open(item.fullImage, '_blank');
                }
            });
            
            thumbnailCell.appendChild(img);
        } else {
            // Kein Bild - zeige Platzhalter
            const placeholder = document.createElement('div');
            placeholder.style.cssText = 'width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; background: #f0f0f0; border-radius: 4px; font-size: 32px; margin: 0 auto;';
            placeholder.textContent = '📷';
            placeholder.title = 'Bild nicht geladen - klicke "Alle Bilder laden"';
            thumbnailCell.appendChild(placeholder);
        }
        
        const nameCell = document.createElement('td');
        nameCell.className = 'copyable';
        nameCell.title = 'Klicken zum Kopieren';
        nameCell.textContent = item.imageName;
        nameCell.addEventListener('click', () => copyToClipboard(item.imageName));
        
        const commentCell = document.createElement('td');
        commentCell.className = 'copyable';
        commentCell.title = 'Klicken zum Kopieren';
        commentCell.textContent = item.comment || '-';
        if (item.comment) {
            commentCell.addEventListener('click', () => copyToClipboard(item.comment));
        }
        
        const actionsCell = document.createElement('td');
        actionsCell.className = 'scrappbook-actions';
        actionsCell.style.textAlign = 'center';
        actionsCell.style.verticalAlign = 'middle';
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'action-btn';
        downloadBtn.title = 'Download';
        downloadBtn.style.cursor = 'pointer';
        downloadBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
            </svg>
        `;
        downloadBtn.addEventListener('click', () => {
            // Finde und klicke Original Download-Link im Grid
            const downloadLink = document.querySelector(`[href*="/download/"][href*="${item.imageId}"]`);
            if (downloadLink) {
                downloadLink.click();
            } else {
                // Fallback: Baue Download-URL mit aktuellem Token
                const collectionId = window.location.hash.match(/\/collection\/edit\/([^\/]+)/)[1];
                const anyDownloadLink = document.querySelector('[href*="authToken"]');
                if (anyDownloadLink) {
                    const tokenMatch = anyDownloadLink.href.match(/authToken=([^&]+)/);
                    if (tokenMatch) {
                        const authToken = tokenMatch[1];
                        const downloadUrl = `https://api-2.scrappbook.de/api/image/download/${collectionId}/${item.imageId}?q=high&authToken=${authToken}`;
                        const a = document.createElement('a');
                        a.href = downloadUrl;
                        a.download = item.imageName;
                        a.click();
                    }
                } else {
                    alert('Download nicht verfügbar - Token nicht gefunden');
                }
            }
        });
        
        actionsCell.appendChild(downloadBtn);
        
        row.appendChild(numberCell);
        row.appendChild(statusCell);
        row.appendChild(thumbnailCell);
        row.appendChild(nameCell);
        row.appendChild(commentCell);
        row.appendChild(actionsCell);
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    
    // Füge Tabelle direkt in Container ein (kein extra Wrapper mehr)
    tableContainer.appendChild(table);
}

// Tabelle verstecken
function hideTable() {
    const tableContainer = document.getElementById('scrappbook-table-container');
    if (tableContainer) {
        tableContainer.style.display = 'none';
    }
    
    const originalContainer = document.querySelector('.sc-cepDVR.eIOBQB') || 
                            document.querySelector('.autosizer') ||
                            document.querySelector('[style*="overflow: visible"]');
    
    if (originalContainer) {
        originalContainer.style.display = 'block';
    }
}

// Sortieren
let sortDirection = {};
function sortTable(column) {
    if (!sortDirection[column]) {
        sortDirection[column] = 'asc';
    } else {
        sortDirection[column] = sortDirection[column] === 'asc' ? 'desc' : 'asc';
    }
    
    const sorted = [...allData].sort((a, b) => {
        let aVal, bVal;
        
        // Spezialbehandlung für Status-Sortierung
        if (column === 'status') {
            // Status-Priorität: beide=3, nur Herz=2, nur Kommentar=1, nichts=0
            aVal = (a.hasHeart && a.hasComment) ? 3 : 
                   (a.hasHeart) ? 2 : 
                   (a.hasComment) ? 1 : 0;
            bVal = (b.hasHeart && b.hasComment) ? 3 : 
                   (b.hasHeart) ? 2 : 
                   (b.hasComment) ? 1 : 0;
        } else {
            aVal = a[column] || '';
            bVal = b[column] || '';
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
        }
        
        if (sortDirection[column] === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
    
    showTable(sorted);
}

// In Zwischenablage kopieren
function copyToClipboard(text) {
    if (text === '-' || !text) return;
    
    navigator.clipboard.writeText(text).then(() => {
        const tooltip = document.createElement('div');
        tooltip.className = 'copy-tooltip';
        tooltip.textContent = 'Kopiert!';
        document.body.appendChild(tooltip);
        
        setTimeout(() => tooltip.remove(), 1500);
    });
}

// Export in verschiedenen Formaten
function exportData(format) {
    const date = new Date().toISOString().split('T')[0];
    let content, filename, mimeType;
    
    // Status als Text-String für Export
    const getStatusText = (item) => {
        if (item.hasHeart && item.hasComment) return 'Herz+Kommentar';
        if (item.hasHeart) return 'Herz';
        if (item.hasComment) return 'Kommentar';
        return '-';
    };
    
    // Escape-Funktionen für verschiedene Formate
    const escapeCSV = (text) => {
        if (!text) return '';
        // Ersetze " mit "" und entferne Newlines
        return text.replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
    };
    
    const escapeMD = (text) => {
        if (!text) return '-';
        // Ersetze Pipe und Newlines für Markdown-Tabellen
        return text.replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
    };
    
    const escapeTXT = (text) => {
        if (!text) return '-';
        // Ersetze Newlines für Text-Format
        return text.replace(/[\r\n]+/g, ' ');
    };
    
    if (format === 'csv') {
        // CSV Format
        content = [
            ['Auswahl', 'Status', 'Bildname', 'Kommentar'].join(','),
            ...allData.map(row => [
                `"${escapeCSV(row.selectionName)}"`,
                `"${getStatusText(row)}"`,
                `"${escapeCSV(row.imageName)}"`,
                `"${escapeCSV(row.comment)}"`
            ].join(','))
        ].join('\n');
        content = '\uFEFF' + content; // BOM für Excel
        filename = `scrappbook-kommentare-${date}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
        
    } else if (format === 'md') {
        // Markdown Format
        const rows = allData.map(row => 
            `| ${getStatusText(row)} | ${escapeMD(row.imageName)} | ${escapeMD(row.comment)} |`
        ).join('\n');
        
        content = `# ${escapeMD(allData[0]?.selectionName || 'Kommentare')}\n\n` +
                  `Exportiert am: ${date}\n\n` +
                  `| Status | Bildname | Kommentar |\n` +
                  `|--------|----------|----------|\n` +
                  rows;
        
        filename = `scrappbook-kommentare-${date}.md`;
        mimeType = 'text/markdown;charset=utf-8;';
        
    } else if (format === 'txt') {
        // Text Format
        const maxNameLength = Math.max(...allData.map(r => r.imageName.length), 10);
        const maxStatusLength = Math.max(...allData.map(r => getStatusText(r).length), 6);
        
        content = `${escapeTXT(allData[0]?.selectionName || 'Kommentare')}\n` +
                  `Exportiert am: ${date}\n` +
                  `${'='.repeat(80)}\n\n` +
                  allData.map(row => {
                      const status = getStatusText(row).padEnd(maxStatusLength);
                      const name = escapeTXT(row.imageName).padEnd(maxNameLength);
                      const comment = escapeTXT(row.comment);
                      return `${status}  |  ${name}  |  ${comment}`;
                  }).join('\n');
        
        filename = `scrappbook-kommentare-${date}.txt`;
        mimeType = 'text/plain;charset=utf-8;';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// Beobachte Auswahl-Wechsel
function observeSelectionChanges() {
    let lastActiveSelectionId = null;
    
    const checkActiveSelection = () => {
        // Nur prüfen wenn Tabelle aktiv ist
        if (!isTableView) return;
        
        const selectionDivs = document.querySelectorAll('[id^="selection_"]');
        let currentActiveId = null;
        
        for (let div of selectionDivs) {
            if (!div.id.includes('_lock')) {
                const opacity = window.getComputedStyle(div).opacity;
                if (opacity === '1') {
                    currentActiveId = div.id;
                    break;
                }
            }
        }
        
        // Wenn sich die aktive Auswahl geändert hat, lade Tabelle neu
        if (currentActiveId && currentActiveId !== lastActiveSelectionId) {
            console.log('🔄 Auswahl gewechselt von', lastActiveSelectionId, 'zu', currentActiveId);
            lastActiveSelectionId = currentActiveId;
            
            // Tabelle neu laden
            if (lastActiveSelectionId) { // Nur beim Wechsel, nicht beim ersten Mal
                console.log('♻️ Lade Tabelle neu...');
                loadDataAndShowTable();
            }
        }
        
        // Setze die ID auch beim ersten Mal
        if (!lastActiveSelectionId && currentActiveId) {
            lastActiveSelectionId = currentActiveId;
        }
    };
    
    // Prüfe alle 500ms auf Änderungen
    setInterval(checkActiveSelection, 500);
}

// URL-Änderungen beobachten
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        isTableView = false;
        
        // Alten Button entfernen
        const oldBtn = document.getElementById('scrappbook-table-toggle');
        if (oldBtn) oldBtn.remove();
        
        // Alte Tabelle entfernen
        const oldTable = document.getElementById('scrappbook-table-container');
        if (oldTable) oldTable.remove();
        
        setTimeout(init, 500);
    }
}).observe(document, { subtree: true, childList: true });

// Initial starten
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Starte Auswahl-Beobachtung
observeSelectionChanges();