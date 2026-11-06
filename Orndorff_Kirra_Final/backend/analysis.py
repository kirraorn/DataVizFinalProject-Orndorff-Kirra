import os
import json
import re
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.feature_extraction.text import TfidfVectorizer

# Configure professional plot aesthetics
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.size'] = 11

def run_deep_analysis():
    json_path = "dashboard_data.json"
    data_path = "data/news_data.json"
    
    if not os.path.exists(json_path) or not os.path.exists(data_path):
        print("[!] Error: Missing dashboard_data.json or raw news_data.json. Run pipeline.py first.")
        return

    print("[*] Loading analytics data for deep exploration...")
    with open(json_path, 'r') as f:
        dash_data = json.load(f)

    df = pd.read_json(data_path, lines=True)
    df['date'] = pd.to_datetime(df['date'])
    df['year'] = df['date'].dt.year

    sector_map = {
        'POLITICS': 'Politics', 'WORLD NEWS': 'Politics', 'THE WORLDPOST': 'Politics',
        'BUSINESS': 'Economy', 'MONEY': 'Economy',
        'ENTERTAINMENT': 'Pop Culture', 'CULTURE & ARTS': 'Pop Culture', 'COMEDY': 'Pop Culture',
        'TECH': 'Technology', 'SCIENCE': 'Technology',
        'ENVIRONMENT': 'Environment', 'GREEN': 'Environment'
    }
    df['mapped_sector'] = df['category'].map(sector_map)

    ai_pattern = r'\b(?:ai|artificial intelligence|machine learning|deep learning|algorithm|algorithms|robot|robots|robotic|automation|neural network|chatgpt|openai|tech|technology|big data)\b'
    df['is_ai'] = df['headline'].fillna('').str.contains(ai_pattern, flags=re.IGNORECASE, regex=True) | \
                  df['short_description'].fillna('').str.contains(ai_pattern, flags=re.IGNORECASE, regex=True)

    df_ai = df[df['is_ai'] & df['mapped_sector'].notnull()].copy()

    # 1. Extract Top Associated Words *Within Each Sector*
    custom_stop_words = list(TfidfVectorizer(stop_words='english').get_stop_words()) + [
        'says', 'said', 'new', 'day', 'make', 'just', 'time', 'like', 'way', 'look', 'years', 'world',
        'get', 'got', 'going', 'one', 'two', 'know', 'see', 'use', 'using', 'used', 'account', 'accused',
        'tech', 'technology', 'ai'
    ]

    sector_top_words = {}
    sectors = ['Technology', 'Economy', 'Politics', 'Pop Culture', 'Environment']
    
    vectorizer = TfidfVectorizer(max_features=1000, stop_words=custom_stop_words, token_pattern=r'(?u)\b[a-zA-Z]{3,}\b')
    
    for sec in sectors:
        sec_df = df_ai[df_ai['mapped_sector'] == sec]
        if len(sec_df) > 5:
            X_sec = vectorizer.fit_transform(sec_df['headline'].fillna(''))
            mean_tfidf = X_sec.mean(axis=0).A1
            top_idx = mean_tfidf.argsort()[::-1]
            feature_names = vectorizer.get_feature_names_out()
            
            terms = []
            for idx in top_idx:
                term = str(feature_names[idx])
                if term not in custom_stop_words and term not in terms:
                    terms.append(term)
                    if len(terms) >= 5:
                        break
            sector_top_words[sec] = terms
        else:
            sector_top_words[sec] = ["Insufficient Data"]

    # --- 2. GENERATE COMPREHENSIVE GRAPHS & VISUALIZATIONS ---
    os.makedirs("output_graphs", exist_ok=True)
    
    # Chart 1: Longitudinal AI Saturation Timeline (Line Chart)
    timeline_df = pd.DataFrame(dash_data['saturation_timeline'])
    timeline_df['year'] = timeline_df['year'].astype(int)
    
    plt.figure(figsize=(10, 6))
    palette = sns.color_palette("tab10", len(sectors))
    for idx, sec in enumerate(sectors):
        if sec in timeline_df.columns:
            plt.plot(timeline_df['year'], timeline_df[sec], marker='o', linewidth=2.5, label=sec, color=palette[idx])
            
    plt.title("Longitudinal AI Terminology Saturation by Sector (2012–2022)", fontsize=14, fontweight='bold', pad=15)
    plt.xlabel("Publication Year", fontsize=12)
    plt.ylabel("AI Saturation Percentage (%)", fontsize=12)
    plt.legend(title="News Sector", frameon=True, facecolor='white')
    plt.grid(True, linestyle='--', alpha=0.6)
    plt.tight_layout()
    plt.savefig("output_graphs/ai_saturation_timeline.png", dpi=300)
    plt.close()

    # Chart 2: Leading Sector Percentage (Bar Chart)
    sec_sat_df = pd.DataFrame(dash_data['sector_saturation']).sort_values(by='percentage', ascending=False)
    
    plt.figure(figsize=(9, 5))
    bars = plt.bar(sec_sat_df['sector'], sec_sat_df['percentage'], color=['#2b5c8f' if s != 'Technology' else '#d95f02' for s in sec_sat_df['sector']], width=0.6)
    plt.title("AI Terminology Penetration Rate Across News Sectors", fontsize=14, fontweight='bold', pad=15)
    plt.xlabel("News Sector", fontsize=12)
    plt.ylabel("Saturation Percentage (%)", fontsize=12)
    plt.grid(axis='y', linestyle='--', alpha=0.6)
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height + 0.2, f"{height}%", ha='center', va='bottom', fontweight='bold', fontsize=10)
    plt.ylim(0, max(sec_sat_df['percentage']) * 1.15)
    plt.tight_layout()
    plt.savefig("output_graphs/sector_saturation_bar.png", dpi=300)
    plt.close()

    # Chart 3: Unsupervised Cluster Size Distribution (Donut Chart)
    clusters_df = pd.DataFrame(dash_data['clusters'])
    
    plt.figure(figsize=(8, 6))
    colors = sns.color_palette("pastel", len(clusters_df))
    plt.pie(clusters_df['count'], labels=clusters_df['name'], autopct='%1.1f%%', startangle=140, colors=colors, 
            wedgeprops=dict(width=0.4, edgecolor='w'))
    plt.title("Semantic Distribution of AI Headline Clusters ($k=5$)", fontsize=14, fontweight='bold', pad=15)
    plt.tight_layout()
    plt.savefig("output_graphs/cluster_distribution_donut.png", dpi=300)
    plt.close()

    # Chart 4: Keyword Association Table (Rendered as PNG)
    fig, ax = plt.subplots(figsize=(10, 4.5))
    ax.axis('off')
    table_data = [[sec, ", ".join(terms)] for sec, terms in sector_top_words.items()]
    table = ax.table(cellText=table_data, colLabels=["News Sector", "Top Associated Headline Terms (TF-IDF)"], loc='center', cellLoc='left')
    table.auto_set_font_size(False)
    table.set_fontsize(11)
    table.scale(1.2, 2.0)
    for key, cell in table.get_celld().items():
        if key[0] == 0:
            cell.set_facecolor('#2b5c8f')
            cell.set_text_props(color='white', fontweight='bold')
        else:
            cell.set_facecolor('#f8f9fa' if key[0] % 2 == 0 else 'white')
    plt.title("Top Associated AI Headline Terms by Sector", fontsize=14, fontweight='bold', pad=20)
    plt.tight_layout()
    plt.savefig("output_graphs/sector_keyword_table.png", dpi=300)
    plt.close()

    # --- NEW CHART 5: Sector-Year Saturation Heatmap ---
    plt.figure(figsize=(10, 6))
    heatmap_data = timeline_df.set_index('year')[sectors].T
    sns.heatmap(heatmap_data, annot=True, fmt=".1f", cmap="YlGnBu", cbar_kws={'label': 'AI Saturation (%)'}, linewidths=0.5)
    plt.title("AI Terminology Saturation Heatmap by Sector (2012–2022)", fontsize=14, fontweight='bold', pad=15)
    plt.xlabel("Publication Year", fontsize=12)
    plt.ylabel("News Sector", fontsize=12)
    plt.tight_layout()
    plt.savefig("output_graphs/sector_year_heatmap.png", dpi=300)
    plt.close()

    # --- NEW CHART 6: Corpus-Wide Top AI Vocabulary (Horizontal Bar Chart) ---
    X_ai_global = vectorizer.fit_transform(df_ai['headline'].fillna(''))
    global_mean_tfidf = X_ai_global.mean(axis=0).A1
    feature_names = vectorizer.get_feature_names_out()
    top_indices = global_mean_tfidf.argsort()[::-1]
    
    vocab_terms, vocab_scores = [], []
    for idx in top_indices:
        term = str(feature_names[idx])
        if term not in custom_stop_words and term not in vocab_terms:
            vocab_terms.append(term)
            vocab_scores.append(global_mean_tfidf[idx])
            if len(vocab_terms) >= 12:
                break
                
    plt.figure(figsize=(9, 6))
    y_pos = np.arange(len(vocab_terms))
    plt.barh(y_pos, vocab_scores[::-1], color='#31a354', align='center')
    plt.yticks(y_pos, vocab_terms[::-1], fontsize=11)
    plt.xlabel("Mean TF-IDF Weight", fontsize=12)
    plt.title("Top Global AI Vocabulary in HuffPost Headlines", fontsize=14, fontweight='bold', pad=15)
    plt.grid(axis='x', linestyle='--', alpha=0.6)
    plt.tight_layout()
    plt.savefig("output_graphs/global_vocab_bar.png", dpi=300)
    plt.close()

    # --- NEW CHART 7: Absolute Volume Stacked Bar Chart ---
    abs_yearly = df_ai.groupby(['year', 'mapped_sector']).size().unstack(fill_value=0)
    for sec in sectors:
        if sec not in abs_yearly.columns:
            abs_yearly[sec] = 0
    abs_yearly = abs_yearly[sectors]

    ax = abs_yearly.plot(kind='bar', stacked=True, figsize=(10, 6), color=palette, edgecolor='none')
    plt.title("Absolute Volume of AI-Related Articles by Sector (2012–2022)", fontsize=14, fontweight='bold', pad=15)
    plt.xlabel("Publication Year", fontsize=12)
    plt.ylabel("Article Count (Absolute Volume)", fontsize=12)
    plt.legend(title="News Sector", bbox_to_anchor=(1.02, 1), loc='upper left')
    plt.grid(axis='y', linestyle='--', alpha=0.6)
    plt.xticks(rotation=0)
    plt.tight_layout()
    plt.savefig("output_graphs/absolute_volume_stacked.png", dpi=300)
    plt.close()

    # --- 3. PRINT CONSOLE ANALYSIS REPORT & TABLE ---
    print("\n" + "="*80)
    print("             DEEP STATISTICAL ANALYSIS & ASSOCIATED KEYWORDS")
    print("="*80)
    print(f" Leading Sector : Technology ({sec_sat_df.iloc[0]['percentage']}% saturation)")
    print(f" Lowest Sector  : {sec_sat_df.iloc[-1]['sector']} ({sec_sat_df.iloc[-1]['percentage']}% saturation)")
    print("-"*80)
    print(f" {'SECTOR':<15} | {'TOP ASSOCIATED HEADLINE TERMS (TF-IDF)'}")
    print("-"*80)
    for sec, terms in sector_top_words.items():
        terms_str = ", ".join(terms)
        print(f" {sec:<15} | {terms_str}")
    print("="*80)
    print("[+] Successfully generated all 7 charts and tables in /output_graphs/!\n")

if __name__ == "__main__":
    run_deep_analysis()