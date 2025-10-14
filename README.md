# 🧠 Argument Detection Machine

## Overview
The **Argument Detection Machine** is a research and experimentation project focused on identifying and classifying **claims**, **evidence**, and **non-informative** text segments.  
Our long-term goal is to **break down the structure of arguments** — teaching models to separate what is being argued (*claims*), what supports those arguments (*evidence*), and what is irrelevant or background noise (*non-informative*).

This project uses datasets from **IBM Project Debater** for the first two categories (claims and evidence) and **synthetically generated text** for the third category (non-informative).  

---

## 📊 Dataset Sources

### 1. Claim Sentences Search Dataset
- Source: [IBM Debater Claim Sentences Search](https://research.ibm.com/haifa/dept/vst/debating_data.shtml)
- Description: Sentences labeled as **claim** or **non-claim** with respect to debate topics.
- Usage: We use positive samples as *claims (label = 1)* and negative samples as *non-informative (label = 0)*.

### 2. Evidence Sentences Dataset
- Source: [IBM Debater Evidence Sentences](https://research.ibm.com/haifa/dept/vst/debating_data.shtml)
- Description: Sentences labeled as **evidence** or **non-evidence** supporting a specific claim.
- Usage: Positive samples serve as *evidence (label = 2)* and negatives may augment the non-informative class.

### 3. Generated Non-Informative Data
- Description: Additional background sentences generated using GPT or other LLMs.
- Purpose: To balance the dataset and provide examples of non-argumentative or off-topic text.
- Examples:
  - “The sky was blue that morning.”
  - “I enjoy coffee before work.”
  - “This paragraph discusses no stance or reasoning.”

---

## 🧩 Label Structure
| Label | Meaning          | Description |
|:------|:-----------------|:-------------|
| 0     | Non-informative  | No clear claim or reasoning |
| 1     | Claim            | Expresses a stance, opinion, or assertion |
| 2     | Evidence         | Provides factual or logical support for a claim |

---

## 🔍 Workflow

1. **Data Collection**
   - Import IBM datasets for *claim* and *evidence* classification.
   - Generate or sample *non-informative* examples.

2. **Data Integration**
   - Merge all sources into a single dataset (`text`, `label`).
   - Balance classes where possible to prevent overfitting.

3. **Preprocessing**
   - Clean text (remove markup, punctuation artifacts, etc.).
   - Tokenize and encode using transformer-based embeddings (BERT, RoBERTa, etc.).

4. **Modeling**
   - Fine-tune a transformer for multi-class text classification (`claim`, `evidence`, `non-informative`).
   - Evaluate using accuracy, F1, and confusion matrices.

5. **Interpretation**
   - Visualize predictions using heatmaps or argument graphs.
   - Explore relationships between claims and their supporting evidence.

---

## 🧪 Example Task
**Input:**
> “Climate change is the biggest threat to humanity because rising sea levels will destroy coastal cities.”

**Output:**
| Sentence Segment | Predicted Label |
|------------------|----------------|
| Climate change is the biggest threat to humanity. | Claim |
| Rising sea levels will destroy coastal cities. | Evidence |

---

## 🛠️ Project Goals
- Develop a reliable argument mining pipeline capable of analyzing debates, essays, or news.
- Build a model that can **automatically detect argument components** in new text.
- Expand to include **stance detection** and **argument quality scoring** in later phases.

---

## 🚀 Future Work
- Implement sentence-level segmentation for mixed claim/evidence sentences.
---

## 🧾 Citation
If you use the IBM Debater datasets, cite:
> Rinott, R., Dankin, L., Perez, C

