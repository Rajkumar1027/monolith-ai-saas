from textblob import TextBlob

def analyze_text(text: str) -> dict:
    analysis = TextBlob(str(text))
    return {
        "sentiment": "positive" if analysis.sentiment.polarity > 0.1 else "negative" if analysis.sentiment.polarity < -0.1 else "neutral",
        "polarity": analysis.sentiment.polarity
    }
