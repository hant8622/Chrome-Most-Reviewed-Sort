let placesList;

document.addEventListener('DOMContentLoaded', () => {

    placesList = document.getElementById('placesList');

    document.getElementById('sortButton').addEventListener('click', async () => {
        placesList.innerHTML = ''; // Clear previous results
        console.log('Test: ' + placesList);

        // Query the active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
        // Execute the script
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const places = Array.from(document.querySelectorAll('.Nv2PK.THOPZb.CpccDe'));
                
                const placesInfo = places.map(place => {
                    const nameElement = place.querySelector('div.qBF1Pd.fontHeadlineSmall');
                    const name = nameElement ? nameElement.textContent.trim() : 'Unknown Place';
                    
                    const reviewCountElement = place.querySelector('.UY7F9');
                    const reviewCount = reviewCountElement ? 
                        parseInt(reviewCountElement.textContent.replace(/[(),]/g, '')) || 0 : 0;
                    
                    const ratingElement = place.querySelector('span.MW4etd');
                    const rating = ratingElement ? parseFloat(ratingElement.textContent) || 0 : 0;

                    return { name, reviewCount, rating };
                });

                return placesInfo.sort((a, b) => b.reviewCount - a.reviewCount);
            }
        });

        // Handle and display results
        if (results && results[0] && results[0].result) {
            const places = results[0].result;
            
            if (places.length === 0) {
                placesList.innerHTML = '<div class="error">No places found</div>';
                return;
            }

            // Display each place
            places.forEach(place => {
                const placeElement = document.createElement('div');
                placeElement.className = 'place-item';
                placeElement.innerHTML = `
                    <div class="place-name">${place.name}</div>
                    <div class="place-reviews">${place.reviewCount} reviews</div>
                    <div class="place-rating">Rating: ${place.rating}</div>
                `;
                placesList.appendChild(placeElement);
            });
        } else {
            placesList.innerHTML = '<div class="error">No places found</div>';
        }

        // Insert sorted elements before the div containing lXJj5c Hk4XGb
        // const container = document.querySelector(".m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde.ecceSd > div.m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde.ecceSd")
        // const lastElement = container.lastElementChild;
        // places.forEach(place => {
        //     place.removeAttribute('data-review-count');
        //     const parent = place.parentNode;
        //     const separator = place.parentNode.nextElementSibling && place.parentNode.nextElementSibling.classList.contains('TFQHme') ? place.parentNode.nextElementSibling : null;
        //     if (separator) {
        //         lastElement.parentNode.insertBefore(separator, lastElement);
        //     }
    
        //     if (lastElement && lastElement.classList.contains('m6QErb')) {
        //         lastElement.parentNode.insertBefore(parent, lastElement.previousElementSibling);
        //     } else {
        //         lastElement.parentNode.insertBefore(parent, lastElement);
        //     }
        // });
    });

});
