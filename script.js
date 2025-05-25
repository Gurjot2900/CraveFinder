async function searchDish() {
    const dish = document.getElementById("dishInput").value.trim();
    const resultsDiv = document.getElementById("results");
    const googleResultsDiv = document.getElementById("googleResults");

    // Clear previous results
    resultsDiv.innerHTML = "";
    googleResultsDiv.innerHTML = "";
    googleResultsDiv.style.display = "none";  // Hide Google section by default

    if (dish === "") {
        resultsDiv.innerHTML = "<p>Please enter a dish name.</p>";
        return;
    }

    // 🔹 Fetch from your local dataset
    try {
        const response = await fetch(`http://127.0.0.1:8000/search?dish=${encodeURIComponent(dish)}`);
        const data = await response.json();

        if (data.results.length === 0) {
            resultsDiv.innerHTML = "<p>No restaurants found for that dish.</p>";
        } else {
            data.results.forEach((restaurant) => {
                const card = document.createElement("div");
                card.classList.add("result-card");
                card.innerHTML = `
                    <h2>${restaurant.name}</h2>
                    <p><strong>Popular Dishes:</strong> ${restaurant.dish_liked}</p>
                    <p><strong>Rating:</strong> ${restaurant.rate}</p>
                    <p><strong>Votes:</strong> ${restaurant.votes}</p>
                    <p><strong>Type:</strong> ${restaurant.rest_type}</p>
                    <p><strong>Location:</strong> ${restaurant.location}</p>
                `;
                resultsDiv.appendChild(card);
            });
        }
    } catch (error) {
        resultsDiv.innerHTML = "<p>Error fetching local data.</p>";
        console.error(error);
    }

    // 🔹 Fetch from Google Places API
    try {
        const googleResponse = await fetch(`http://127.0.0.1:8000/recommendations?dish=${encodeURIComponent(dish)}&location=Bangalore`);
        const googleData = await googleResponse.json();

        if (googleData.recommendations.length === 0) {
            googleResultsDiv.innerHTML = "<p>No Google recommendations found.</p>";
        } else {
            googleResultsDiv.style.display = "block"; // Show section only if there are results

            // Add heading using createElement (don’t overwrite innerHTML)
            const heading = document.createElement("h2");
            heading.textContent = "Craving for more? Recommendations from Google";
            heading.style.gridColumn = "1 / -1"; // Make heading span full width
            googleResultsDiv.appendChild(heading);

            // Append all cards
            googleData.recommendations.forEach(place => {
                const card = document.createElement("div");
                card.className = "result-card";
                card.innerHTML = `
            <h3>${place.name}</h3>
            <p><strong>Address:</strong> ${place.address}</p>
            <p><strong>Rating:</strong> ${place.rating} (${place.user_ratings_total} reviews)</p>
            <a href="https://www.google.com/maps/place/?q=place_id:${place.place_id}" target="_blank">📍 View on Google Maps</a>
        `;
                googleResultsDiv.appendChild(card);
            });
        }
    } catch (error) {
        googleResultsDiv.innerHTML = "<p>Failed to fetch Google recommendations.</p>";
        console.error("Google API error:", error);
    }
}

