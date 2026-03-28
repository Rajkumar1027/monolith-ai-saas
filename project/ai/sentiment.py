from transformers import pipeline

sentiment_model = pipeline("sentiment-analysis", low_cpu_mem_usage=True)

def analyze_sentiment(text):
    return sentiment_model(text)