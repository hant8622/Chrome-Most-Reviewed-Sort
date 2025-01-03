let placesList;

document.addEventListener('DOMContentLoaded', () => {
    placesList = document.getElementById('placesList');
    loadSavedResults(); // Load saved results when popup opens

    // Add event delegation for links
    placesList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('hfpxzc')) {
            e.preventDefault();
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Check if current page is Google Maps
            if (!tab.url.includes('google.com/maps')) {
                // If not on Google Maps, open a new Google Maps tab
                chrome.tabs.create({ url: e.target.href});
            } else {
                // If already on Google Maps, just update the current tab
                chrome.tabs.update({ url: e.target.href });
            }
        }
    });

    document.getElementById('resetButton').addEventListener('click', () => {
        // Clear the display
        placesList.innerHTML = '';
        
        // Remove any added styles
        const addedStyles = document.querySelectorAll('style');
        addedStyles.forEach(style => style.remove());
        
        // Save the cleared state
        chrome.storage.local.set({
            savedResults: {
                isCleared: true
            }
        });
    });

    document.getElementById('sortButton').addEventListener('click', async () => {
        // Query the active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
        // Execute the script
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // Helper function to clean HTML of unwanted elements
                const cleanHtml = (html) => {
                    const temp = document.createElement('div');
                    temp.innerHTML = html;

                    // Preserve href attributes while cleaning
                    temp.querySelectorAll('.hfpxzc').forEach(link => {
                        const href = link.getAttribute('href');
                        if (href) {
                            link.href = new URL(href, window.location.href).href;
                        }
                    });
                    
                    // Remove elements with specified classes
                    ['qty3Ue', 'hHbUWd', 'gwQ6lc'].forEach(className => {
                        temp.querySelectorAll(`.${className}`).forEach(element => {
                            element.remove();
                        });
                    });

                    // Find and remove the specific sequence of .AyRUI followed by .m6QErb.XiKgde.UhIuC
                    const targetElements = temp.querySelectorAll('.m6QErb.XiKgde.UhIuC');
                    targetElements.forEach(element => {
                        const previousElement = element.previousElementSibling;
                        if (previousElement && previousElement.classList.contains('AyRUI')) {
                            previousElement.remove(); // Remove the .AyRUI element
                            element.remove(); // Remove the container
                        }
                    });
                    
                    return temp.innerHTML;
                };

                // Get all styles for elements within .Nv2PK.THOPZb.CpccDe
                const styles = Array.from(document.styleSheets)
                    .map(sheet => {
                        try {
                            return Array.from(sheet.cssRules)
                                .filter(rule => {
                                    if (!rule.selectorText) return false;

                                    // Get all elements within a place container
                                    const placeContainer = document.querySelector('.Nv2PK.THOPZb.CpccDe');
                                    if (!placeContainer) return false;

                                    // Get all unique classes used within the container
                                    const allElements = placeContainer.getElementsByTagName('*');
                                    const allClasses = new Set();
                                    Array.from(allElements).forEach(element => {
                                        Array.from(element.classList).forEach(className => {
                                            allClasses.add('.' + className);
                                        });
                                    });

                                    // Check if the rule applies to any element within the container
                                    return Array.from(allClasses).some(className => 
                                        rule.selectorText.includes(className)
                                    ) || rule.selectorText.includes('.Nv2PK');
                                })
                                .map(rule => rule.cssText)
                                .join('\n');
                        } catch (e) {
                            return '';
                        }
                    })
                    .join('\n');

                // Select all places listed
                const places = Array.from(document.querySelectorAll('.Nv2PK.THOPZb.CpccDe'));
                
                // Iterate over each place and obtain their review counts
                places.forEach(place => {
                    const reviewCountElement = place.querySelector('.UY7F9');
                    if (reviewCountElement) {
                        const reviewCount = parseInt(reviewCountElement.textContent.replace(/[(),]/g, ''));
                        place.dataset.reviewCount = reviewCount;
                    }
                });
                
                // Sort the places by review count in descending order
                const sortedPlaces = places
                    .sort((a, b) => b.dataset.reviewCount - a.dataset.reviewCount)
                    .map(place => cleanHtml(place.outerHTML)); // Clean each place's HTML

                return {
                    places: sortedPlaces,
                    styles: styles
                };
            }
        });

        // Handle and display results
        if (results && results[0] && results[0].result) {
            const { places, styles } = results[0].result;
            
            if (places.length === 0) {
                // Save the "No places found" state
                chrome.storage.local.set({
                    savedResults: {
                        hasError: true,
                        errorMessage: 'No places found',
                        isCleared: false
                    }
                });
                placesList.innerHTML = '<div class="error">No places found</div>';
            } else {
                // Save the successful results
                chrome.storage.local.set({
                    savedResults: {
                        hasError: false,
                        places,
                        styles,
                        isCleared: false
                    }
                });
                displayResults(places, styles);
            }

        } else {
            // Save the error state
            chrome.storage.local.set({
                savedResults: {
                    hasError: true,
                    errorMessage: 'No places found',
                    isCleared: false
                }
            });
            placesList.innerHTML = '<div class="error">No places found</div>';
        }
    });

});

// Function to display results
function displayResults(places, styles) {
    // Add styles
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    // Display each place with rank number
    places.forEach((place, index) => {
        const placeElement = document.createElement('div');
        placeElement.className = 'place-item';
        
        // Add rank number
        const rankNumber = document.createElement('div');
        rankNumber.className = 'rank-number';
        rankNumber.textContent = index + 1;
        
        placeElement.appendChild(rankNumber);
        placeElement.insertAdjacentHTML('beforeend', place);
        placesList.appendChild(placeElement);
    });
}

async function loadSavedResults() {
    const data = await chrome.storage.local.get('savedResults');
    if (data.savedResults) {
        if (data.savedResults.isCleared) {
            // If the state was cleared, keep it empty
            placesList.innerHTML = '';
            return;
        }
        
        if (data.savedResults.hasError) {
            placesList.innerHTML = `<div class="error">${data.savedResults.errorMessage}</div>`;
        } else if (data.savedResults.places) {
            displayResults(data.savedResults.places, data.savedResults.styles);
        }
    }
}
