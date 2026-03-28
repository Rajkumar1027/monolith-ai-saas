from transformers import pipeline

sentiment_model = pipeline("sentiment-analysis")

def analyze_sentiment(text):
    return sentiment_model(text)