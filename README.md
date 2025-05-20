# CVPR 2025 Papers Map

CVPR 2025 の論文マップを作成・表示するプロジェクトです。論文タイトルを自然言語モデルで特徴ベクトルに変換し、t-SNE と UMAP で 2 次元に圧縮して可視化します。

## 主な機能

- 論文タイトルを自然言語モデルで埋め込みベクトルに変換
- t-SNE と UMAP で埋め込みベクトルを 2 次元に圧縮
- React+D3.js で論文マップをインタラクティブに可視化
- 論文を検索して特定の論文をハイライト表示
- 論文の詳細情報（著者、セッション、場所、URL）を表示

## プロジェクト構成

- `cvpr_parser/`: Node.js で実装された CVPR 論文パーサー

  - `parse_cvpr.js`: HTML から CSV に変換するパーサー
  - `cvpr_papers.csv`: パースされた論文データ

- `embed_papers.py`: 論文タイトルを埋め込みベクトルに変換し、次元圧縮するスクリプト

- `cvpr_paper_map/`: React で実装された論文マップビューア
  - `src/`: React アプリケーションソース
  - `public/`: 静的アセット

## 使用方法

### 1. 論文データを処理して埋め込みベクトルと可視化データを生成

```bash
# 必要なPythonライブラリをインストール
pip install -r requirements.txt

# 論文タイトルを埋め込みベクトルに変換し、次元圧縮して可視化データを生成
python embed_papers.py
```

これにより、`paper_map_data/`ディレクトリに以下のファイルが生成されます：

- `tsne_papers.json`: t-SNE で次元圧縮されたデータ
- `umap_papers.json`: UMAP で次元圧縮されたデータ
- `tsne_papers.png`: t-SNE の可視化プレビュー
- `umap_papers.png`: UMAP の可視化プレビュー

### 2. React アプリケーションを設定

```bash
# 生成されたJSONファイルをReactアプリのdataディレクトリにコピー
mkdir -p cvpr_paper_map/src/data
cp paper_map_data/tsne_papers.json paper_map_data/umap_papers.json cvpr_paper_map/src/data/

# Reactアプリのディレクトリに移動
cd cvpr_paper_map

# 依存関係をインストール
npm install
```

### 3. React アプリケーションをローカルで実行

```bash
npm start
```

ブラウザで http://localhost:3000 を開いて論文マップを確認できます。

## カスタマイズ

### 埋め込みモデルの変更

`embed_papers.py`の`MODEL_NAME`定数を変更することで、別の言語モデルを使用できます：

```python
MODEL_NAME = 'all-MiniLM-L6-v2'  # デフォルト
# または以下のような他のモデルに変更
# MODEL_NAME = 'paraphrase-multilingual-MiniLM-L12-v2'  # 多言語モデル
# MODEL_NAME = 'all-mpnet-base-v2'  # より大きなモデル
```

### 可視化パラメータの調整

`embed_papers.py`の`reduce_dimensions`関数内で、t-SNE や UMAP のパラメータを調整できます：

```python
# t-SNEのパラメータ
reducer = TSNE(n_components=2, random_state=42, perplexity=30)

# UMAPのパラメータ
reducer = UMAP(n_components=2, random_state=42, n_neighbors=15, min_dist=0.1)
```
