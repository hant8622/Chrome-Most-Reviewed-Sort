let placesList;

document.addEventListener('DOMContentLoaded', () => {

    placesList = document.getElementById('placesList');

    document.getElementById('sortButton').addEventListener('click', async () => {
        placesList.innerHTML = ''; // Clear previous results

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
                placesList.innerHTML = '<div class="error">No places found</div>';
                return;
            }

            // Add styles
            const styleElement = document.createElement('style');
            styleElement.textContent = styles;
            document.head.appendChild(styleElement);

            // Display each place
            places.forEach(place => {
                const placeElement = document.createElement('div');
                placeElement.className = 'place-item';
                placeElement.innerHTML = place;
                placesList.appendChild(placeElement);
            });
        } else {
            placesList.innerHTML = '<div class="error">No places found</div>';
        }
    });

});
