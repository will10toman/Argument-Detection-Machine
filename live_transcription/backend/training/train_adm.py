import os
import torch
import pandas as pd
from transformers import (
    DistilBertTokenizerFast,
    DistilBertForSequenceClassification,
    Trainer,
    TrainingArguments
)

os.environ["WANDB_DISABLED"] = "true"

# -----------------------------------------------------
#  PATH SETUP (3 levels up from training/)
# -----------------------------------------------------
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

CSV_PATH = os.path.join(BASE_DIR, "argumentdetection8.csv")
HF_MODEL_DIR = os.path.join(BASE_DIR, "hf_distilbert_argdetector")
TORCHSCRIPT_PATH = os.path.join(
    BASE_DIR, "live_transcription", "backend", "models", "adm_model.pt"
)

print("CSV Path:", CSV_PATH)
print("HF Output:", HF_MODEL_DIR)
print("TorchScript Output:", TORCHSCRIPT_PATH)

# -----------------------------------------------------
#  LOAD CSV
# -----------------------------------------------------
print("\nLoading dataset...")
df = pd.read_csv(CSV_PATH)

assert "sentence" in df.columns
assert "category" in df.columns

# -----------------------------------------------------
#  BALANCED SAMPLE: 25k PER CLASS
# -----------------------------------------------------
TARGET_N = 25000

df_sample = (
    df.groupby("category", group_keys=False)
      .apply(lambda x: x.sample(n=min(len(x), TARGET_N), random_state=11))
)

print("\nBalanced sample counts:")
print(df_sample["category"].value_counts())

# -----------------------------------------------------
#  LABEL MAP
# -----------------------------------------------------
label2id = {"claim": 0, "evidence": 1, "non_info": 2}
id2label = {v: k for k, v in label2id.items()}

df_sample["label_id"] = df_sample["category"].map(label2id)

if df_sample["label_id"].isna().any():
    print(df_sample[df_sample["label_id"].isna()])
    raise SystemExit("Your CSV contains categories outside claim/evidence/non_info")

texts = df_sample["sentence"].tolist()
labels = df_sample["label_id"].tolist()

print(f"\nTraining on {len(texts)} samples.")

# -----------------------------------------------------
#  TOKENIZE
# -----------------------------------------------------
tokenizer = DistilBertTokenizerFast.from_pretrained("distilbert-base-uncased")

enc = tokenizer(
    texts,
    truncation=True,
    padding=True,
    max_length=256
)

# -----------------------------------------------------
#  DATASET
# -----------------------------------------------------
class ArgDataset(torch.utils.data.Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __getitem__(self, idx):
        item = {k: torch.tensor(v[idx]) for k, v in self.encodings.items()}
        item["labels"] = torch.tensor(self.labels[idx])
        return item

    def __len__(self):
        return len(self.labels)

train_dataset = ArgDataset(enc, labels)

# -----------------------------------------------------
#  MODEL
# -----------------------------------------------------
model = DistilBertForSequenceClassification.from_pretrained(
    "distilbert-base-uncased",
    num_labels=3,
    id2label=id2label,
    label2id=label2id
)

# -----------------------------------------------------
#  TRAINING CONFIG
# -----------------------------------------------------
training_args = TrainingArguments(
    output_dir=os.path.join(BASE_DIR, "results"),
    num_train_epochs=2,
    per_device_train_batch_size=8,
    warmup_steps=100,
    weight_decay=0.01,
    logging_dir=os.path.join(BASE_DIR, "logs"),
    logging_steps=20,
    save_strategy="epoch",
    evaluation_strategy="no"
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset
)

# -----------------------------------------------------
#  TRAIN
# -----------------------------------------------------
print("\nStarting training...\n")
trainer.train()

# -----------------------------------------------------
#  SAVE HF MODEL
# -----------------------------------------------------
print("\nSaving HuggingFace model...")
trainer.save_model(HF_MODEL_DIR)

# -----------------------------------------------------
#  TORCHSCRIPT EXPORT
# -----------------------------------------------------
print("\nExporting TorchScript...")

model.eval()
example = tokenizer("trace", return_tensors="pt")
input_ids = example["input_ids"]
attention_mask = example["attention_mask"]

class TorchWrapper(torch.nn.Module):
    def __init__(self, m):
        super().__init__()
        self.m = m

    def forward(self, input_ids, attention_mask):
        out = self.m(input_ids=input_ids, attention_mask=attention_mask)
        return out.logits

wrapper = TorchWrapper(model)
ts = torch.jit.trace(wrapper, (input_ids, attention_mask))
torch.jit.save(ts, TORCHSCRIPT_PATH)

print("\nSaved TorchScript to:", TORCHSCRIPT_PATH)
print("\nDONE.\n")
