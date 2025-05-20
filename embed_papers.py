#!/usr/bin/env python3
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.manifold import TSNE
from umap import UMAP
import json
import os
import torch
import matplotlib.pyplot as plt
from pathlib import Path

# モデル名の定数
MODEL_NAME = 'all-MiniLM-L6-v2'


def load_data(csv_path):
    """CSVファイルから論文データを読み込む"""
    print(f"Loading data from {csv_path}")
    df = pd.read_csv(csv_path)
    # タイトルに欠損値がある行を除外
    df = df.dropna(subset=['Title'])
    print(f"Loaded {len(df)} papers")
    return df


def generate_embeddings(texts, model_name=MODEL_NAME, batch_size=32):
    """文章をベクトルに変換する"""
    print(f"Loading model: {model_name}")
    model = SentenceTransformer(model_name)
    print(f"Generating embeddings for {len(texts)} texts")

    # バッチ処理で埋め込みを生成
    embeddings = model.encode(
        texts, batch_size=batch_size, show_progress_bar=True)
    print(f"Generated embeddings of shape {embeddings.shape}")
    return embeddings


def reduce_dimensions(embeddings, method='tsne', n_components=2, random_state=42):
    """次元削減を行う"""
    print(f"Reducing dimensions using {method}")

    if method.lower() == 'tsne':
        reducer = TSNE(n_components=n_components,
                       random_state=random_state, perplexity=30)
    elif method.lower() == 'umap':
        reducer = UMAP(n_components=n_components, random_state=random_state)
    else:
        raise ValueError(f"Unknown method: {method}. Use 'tsne' or 'umap'.")

    reduced_data = reducer.fit_transform(embeddings)
    print(f"Reduced dimensions to shape {reduced_data.shape}")
    return reduced_data


def prepare_visualization_data(df, coordinates):
    """可視化用のデータを準備する"""
    print("Preparing visualization data")

    # 座標を正規化
    x_min, x_max = coordinates[:, 0].min(), coordinates[:, 0].max()
    y_min, y_max = coordinates[:, 1].min(), coordinates[:, 1].max()

    normalized_coords = np.zeros_like(coordinates)
    normalized_coords[:, 0] = (coordinates[:, 0] - x_min) / (x_max - x_min)
    normalized_coords[:, 1] = (coordinates[:, 1] - y_min) / (y_max - y_min)

    # JSONに変換するためのデータを準備
    visualization_data = []
    for i, row in df.iterrows():
        paper_data = {
            'id': i,
            'title': row['Title'],
            'authors': row['Authors'],
            'session': row['Poster Session'] if not pd.isna(row['Poster Session']) else '',
            'location': row['Location'] if not pd.isna(row['Location']) else '',
            'url': row['URL'] if not pd.isna(row['URL']) else '',
            'x': float(normalized_coords[i, 0]),
            'y': float(normalized_coords[i, 1])
        }
        visualization_data.append(paper_data)

    return visualization_data


def save_visualization_data(data, output_path):
    """JSONファイルに可視化データを保存する"""
    print(f"Saving visualization data to {output_path}")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Data saved to {output_path}")


def plot_embeddings(coordinates, df, output_path):
    """埋め込みをプロットしてPNGファイルとして保存する"""
    plt.figure(figsize=(12, 10))
    plt.scatter(coordinates[:, 0], coordinates[:, 1], s=10, alpha=0.6)
    plt.title('CVPR 2025 Papers Map')
    plt.xlabel('Dimension 1')
    plt.ylabel('Dimension 2')
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    print(f"Plot saved to {output_path}")


def main():
    # 入力CSVファイルのパス
    input_csv = 'cvpr_parser/cvpr_papers.csv'

    # 出力ディレクトリの作成
    output_dir = 'paper_map_data'
    os.makedirs(output_dir, exist_ok=True)

    # データ読み込み
    papers_df = load_data(input_csv)

    # 埋め込み生成
    embeddings = generate_embeddings(papers_df['Title'].tolist())

    # 次元削減（T-SNE）
    tsne_coords = reduce_dimensions(embeddings, method='tsne')

    # 次元削減（UMAP）
    umap_coords = reduce_dimensions(embeddings, method='umap')

    # 可視化データ準備
    tsne_viz_data = prepare_visualization_data(papers_df, tsne_coords)
    umap_viz_data = prepare_visualization_data(papers_df, umap_coords)

    # JSONファイル保存
    save_visualization_data(tsne_viz_data, os.path.join(
        output_dir, 'tsne_papers.json'))
    save_visualization_data(umap_viz_data, os.path.join(
        output_dir, 'umap_papers.json'))

    # 埋め込みをプロット
    plot_embeddings(tsne_coords, papers_df, os.path.join(
        output_dir, 'tsne_papers.png'))
    plot_embeddings(umap_coords, papers_df, os.path.join(
        output_dir, 'umap_papers.png'))

    print("Processing complete!")


if __name__ == "__main__":
    main()
