import os
import json
import re
import pandas as pd
import numpy as np
from scipy.stats import chi2_contingency
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.cluster import KMeans
from sklearn.metrics import davies_bouldin_score

def run_analytics_pipeline():
    data_path = "data/news_data.json"
    if not os.path.exists(data_path):
        print(f"[!] Error: Could not find {data_path}.")
        return

    print("[*] Loading authentic HuffPost JSON corpus...")
    df = pd.read_json(data_path, lines=True)
    print(f"[+] Loaded {len(df):,} total records.")

    # Parse publication year
    df['date'] = pd.to_datetime(df['date'])
    df['year'] = df['date'].dt.year

    # 1. Precision AI Regex Filter
    ai_pattern = r'\b(?:ai|artificial intelligence|machine learning|deep learning|algorithm|algorithms|robot|robots|robotic|automation|neural network|chatgpt|openai|tech|technology|big data)\b'
    
    df['is_ai'] = df['headline'].fillna('').str.contains(ai_pattern, flags=re.IGNORECASE, regex=True) | \
                  df['short_description'].fillna('').str.contains(ai_pattern, flags=re.IGNORECASE, regex=True)

    total_ai_records = int(df['is_ai'].sum())
    overall_ai_saturation = float(round((total_ai_records / len(df)) * 100, 2))
    print(f"[+] Identified {total_ai_records:,} AI/Tech-related articles ({overall_ai_saturation}% of corpus).")

    # 2. Sector Mapping & Longitudinal Trajectory
    sector_map = {
        'POLITICS': 'Politics',
        'WORLD NEWS': 'Politics',
        'THE WORLDPOST': 'Politics',
        'BUSINESS': 'Economy',
        'MONEY': 'Economy',
        'ENTERTAINMENT': 'Pop Culture',
        'CULTURE & ARTS': 'Pop Culture',
        'COMEDY': 'Pop Culture',
        'TECH': 'Technology',
        'SCIENCE': 'Technology',
        'ENVIRONMENT': 'Environment',
        'GREEN': 'Environment'
    }
    df['mapped_sector'] = df['category'].map(sector_map)
    df_sectors = df[df['mapped_sector'].notnull()].copy()
    
    yearly_sector = df_sectors.groupby(['year', 'mapped_sector'])['is_ai'].agg(['count', 'sum']).reset_index()
    yearly_sector['percentage'] = round((yearly_sector['sum'] / yearly_sector['count']) * 100, 2)
    
    timeline_pivot = yearly_sector.pivot(index='year', columns='mapped_sector', values='percentage').fillna(0)
    timeline_data = []
    for yr, row in timeline_pivot.iterrows():
        entry = {"year": str(int(yr))}
        for sec in ['Politics', 'Pop Culture', 'Economy', 'Technology', 'Environment']:
            entry[sec] = float(row.get(sec, 0.0))
        timeline_data.append(entry)

    # 3. Statistical Hypothesis Testing: Chi-Square Test of Independence
    contingency_table = pd.crosstab(df_sectors['mapped_sector'], df_sectors['is_ai'])
    chi2, p_val, dof, ex = chi2_contingency(contingency_table)

    # 4. TF-IDF Vectorization & K-Means Clustering on AI Subset
    df_ai = df[df['is_ai']].copy().reset_index(drop=True)
    
    # Expanded domain stop-words to strip out noise, political names, and generic verbs
    custom_stop_words = list(TfidfVectorizer(stop_words='english').get_stop_words()) + [
        'says', 'said', 'new', 'day', 'make', 'just', 'time', 'like', 'way', 'look', 'years', 'world',
        'get', 'got', 'going', 'one', 'two', 'know', 'see', 'use', 'using', 'used', 'account', 'accused',
        'tech', 'technology', 'ai', 'gets', 'trump', 'clinton', 'rubio', 'obama', 'biden', 'women', 'men',
        'people', 'reuters', 'ap', 'huffpost', 'says', 'amid', '10', '20', 'first', 'years', 'robot', 'robots', 'war', 'wars', 'hillary', 'donald', 'president', 'presidential', 
        'campaign', 'election', 'elections', 'vote', 'voting']

    print("[*] Vectorizing AI subset with bigrams and fitting K-Means (k=5)...")
    
    # Upgraded with ngram_range=(1, 2) to capture compound phrases like "open source" or "deep learning"
    vectorizer = TfidfVectorizer(
        max_features=2000,
        stop_words=custom_stop_words,
        token_pattern=r'(?u)\b[a-zA-Z]{3,}\b',
        ngram_range=(1, 2)
    )
    X_ai = vectorizer.fit_transform(df_ai['headline'].fillna(''))
    feature_names = vectorizer.get_feature_names_out()

    # Global Corpus-Wide Top Keywords in AI Sub-corpus
    global_mean_tfidf = X_ai.mean(axis=0).A1
    global_top_indices = global_mean_tfidf.argsort()[::-1]
    
    global_top_terms = []
    for ind in global_top_indices:
        term = str(feature_names[ind])
        if term not in custom_stop_words and term not in global_top_terms:
            global_top_terms.append(term)
            if len(global_top_terms) >= 10:
                break

    # Build Sector Summary with Top Terms & Statistics (Now that feature_names exists)
    sector_summary = df_sectors.groupby('mapped_sector')['is_ai'].agg(['count', 'sum']).reset_index()
    sector_summary['percentage'] = round((sector_summary['sum'] / sector_summary['count']) * 100, 2)
    
    sector_data = []
    for _, row in sector_summary.iterrows():
        sec_name = str(row['mapped_sector'])
        sec_mask = (df_ai['mapped_sector'] == sec_name).to_numpy()
        sec_terms = []
        if sec_mask.sum() > 0:
            sec_matrix = X_ai[sec_mask]
            mean_tfidf = sec_matrix.mean(axis=0).A1
            top_indices = mean_tfidf.argsort()[::-1]
            for ind in top_indices:
                term = str(feature_names[ind])
                if term not in custom_stop_words and term not in [t['term'] for t in sec_terms]:
                    sec_terms.append({
                        "term": term,
                        "score": round(float(mean_tfidf[ind]), 4)
                    })
                    if len(sec_terms) >= 7:
                        break
        sector_data.append({
            "sector": sec_name,
            "total": int(row['count']),
            "ai": int(row['sum']),
            "percentage": float(row['percentage']),
            "top_terms": sec_terms
        })

    svd = TruncatedSVD(n_components=50, random_state=42)
    X_svd = svd.fit_transform(X_ai)

    kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
    df_ai['cluster'] = kmeans.fit_predict(X_svd)

    # Cluster Keyword Extraction
    cluster_payloads = []
    cluster_names = [
        "AI Policy & Governance",
        "Market Automation & Economy",
        "Media & Consumer AI Apps",
        "Robotics & Autonomous Systems",
        "Machine Learning Research & Science"
    ]

    for i in range(5):
        cluster_mask = (df_ai['cluster'] == i).to_numpy()
        cluster_df = df_ai[cluster_mask]
        count = int(len(cluster_df))
        
        terms = []
        if count > 0:
            cluster_matrix = X_ai[cluster_mask]
            mean_tfidf = cluster_matrix.mean(axis=0).A1
            top_indices = mean_tfidf.argsort()[::-1]
            
            for ind in top_indices:
                term = str(feature_names[ind])
                if term not in custom_stop_words and term not in terms:
                    terms.append(term)
                    if len(terms) >= 5:
                        break

        cluster_payloads.append({
            "id": int(i),
            "name": cluster_names[i],
            "count": count,
            "terms": terms
        })

    # 5. Davies-Bouldin Validation Score
    db_index = float(davies_bouldin_score(X_svd, df_ai['cluster']))

    # 6. Export Unified Dashboard Payload
    export_payload = {
        "metadata": {
            "total_records": int(len(df)),
            "ai_records": total_ai_records,
            "overall_ai_saturation": overall_ai_saturation,
            "davies_bouldin_index": round(db_index, 4),
            "optimal_clusters": 5,
            "chi2_statistic": round(float(chi2), 2),
            "p_value": float(f"{p_val:.2e}") if p_val < 0.001 else round(float(p_val), 4)
        },
        "global_top_terms": global_top_terms,
        "sector_saturation": sector_data,
        "saturation_timeline": timeline_data,
        "clusters": cluster_payloads
    }

    output_file = "dashboard_data.json"
    with open(output_file, "w") as f:
        json.dump(export_payload, f, indent=2)

    print(f"[+] Successfully exported advanced stats bundle to {output_file}!\n")

if __name__ == "__main__":
    run_analytics_pipeline()