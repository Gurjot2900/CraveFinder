from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import requests
from dotenv import load_dotenv


# Initialize the FastAPI app
app = FastAPI(title="CraveFinder API", version="1.0")

# Enable CORS for frontend requests (you can restrict origins later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load your dataset once at startup
df = pd.read_csv("cleaned_zomato_data.csv")

# Clean rating column (optional step for sorting)
def clean_rating(r):
    try:
        return float(str(r).split('/')[0].strip())
    except:
        return 0.0

df['clean_rate'] = df['rate'].apply(clean_rating)

# API root check
@app.get("/")
def home():
    return {"message": "Welcome to CraveFinder API!"}

# Search endpoint for dish-based queries
@app.get("/search")
def search_dish(dish: str = Query(..., description="Dish you are craving")):
    # Filter rows where the dish is mentioned (case-insensitive)
    results = df[df['dish_liked'].str.contains(dish, case=False, na=False)]

    # Sort by rating and votes
    results = results.sort_values(by=['clean_rate', 'votes'], ascending=False)

    # Select important fields and limit results
    top_results = results[['name', 'dish_liked', 'rate', 'votes', 'rest_type', 'location']].head(12)

    # Convert to dict for JSON response
    return {"results": top_results.to_dict(orient="records")}

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

@app.get("/recommendations")
def get_recommendations(dish: str = Query(...), location: str = "Bangalore"):
    query = f"{dish} restaurants in {location}"
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {
        "query": query,
        "key": GOOGLE_API_KEY
    }

    try:
        response = requests.get(url, params=params)
        print("URL:", response.url)
        data = response.json()
        print("Response:", data)
        recommendations = []

        for place in data.get("results", []):
            recommendations.append({
                "name": place.get("name"),
                "address": place.get("formatted_address"),
                "rating": place.get("rating"),
                "user_ratings_total": place.get("user_ratings_total"),
                "place_id": place.get("place_id"),
                "types": place.get("types", [])
            })

        return {"recommendations": recommendations[:10]}

    except Exception as e:
        return {"error": str(e)}