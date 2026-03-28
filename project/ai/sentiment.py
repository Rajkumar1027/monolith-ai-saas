from textblob import TextBlob

def analyze_sentiment(text: str):
    polarity = TextBlob(text).sentiment.polarity
    # Polarity > 0 is positive, < 0 is negative
    label = "POSITIVE" if polarity > 0 else "NEGATIVE"
    return [{"label": label, "score": abs(polarity)}]