"""
最小可运行 RAG 脚本
- 纯 Python 标准库，零外部依赖
- 支持 .txt / .docx 知识文档
- 默认 chunk_size=80, overlap=20
- 自动提取问题 + 交互式提问 + 参数对比
"""

import sys
import math
import re
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

# ─────────────────────────────────────────────
# 1. 文档读取
# ─────────────────────────────────────────────

def load_docx_text(path):
    """用标准库读取 .docx，按段落返回文本列表"""
    paragraphs = []
    with zipfile.ZipFile(path) as z:
        xml_content = z.read("word/document.xml")
        root = ET.fromstring(xml_content)
        ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
        for para in root.iter(f"{{{ns}}}p"):
            texts = []
            for t in para.iter(f"{{{ns}}}t"):
                if t.text:
                    texts.append(t.text)
            line = "".join(texts).strip()
            if line:
                paragraphs.append(line)
    return paragraphs


def load_document(path):
    """自动检测 .txt / .docx 并读取为纯文本"""
    p = Path(path)
    if not p.exists():
        print(f"[错误] 文件不存在: {path}")
        sys.exit(1)

    if p.suffix.lower() == ".txt":
        return p.read_text(encoding="utf-8")
    elif p.suffix.lower() == ".docx":
        paras = load_docx_text(path)
        return "\n".join(paras)
    else:
        print(f"[错误] 不支持的文件格式: {p.suffix}（仅支持 .txt 和 .docx）")
        sys.exit(1)


# ─────────────────────────────────────────────
# 2. 文本切分
# ─────────────────────────────────────────────

def split_text(text, chunk_size=80, overlap=20):
    if chunk_size <= 0:
        raise ValueError("chunk_size 必须大于 0")
    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("overlap 必须满足 0 <= overlap < chunk_size")

    chunks = []
    start, chunk_id = 0, 1
    step = chunk_size - overlap
    while start < len(text):
        end = min(start + chunk_size, len(text))
        content = text[start:end].strip()
        if content:
            match = re.search(r"\[来源：([^\]]+)\]", content)
            source = match.group(1) if match else "知识文档"
            chunks.append({
                "id": chunk_id, "start": start, "end": end,
                "source": source, "text": content,
            })
            chunk_id += 1
        if end == len(text):
            break
        start += step
    return chunks


# ─────────────────────────────────────────────
# 3. TF-IDF 检索
# ─────────────────────────────────────────────

def tokenize(text):
    """中文字符二元组 + 英文/数字词"""
    text = re.sub(r"\s+", "", text.lower())
    chinese_runs = re.findall(r"[\u4e00-\u9fff]+", text)
    chinese_bigrams = [
        run[i:i+2] for run in chinese_runs for i in range(len(run) - 1)
    ]
    latin_words = re.findall(r"[a-z0-9]+", text)
    return chinese_bigrams + latin_words


def build_tfidf(texts):
    token_lists = [tokenize(text) for text in texts]
    doc_frequency = Counter(
        {term: 0 for tokens in token_lists for term in set(tokens)}
    )
    for tokens in token_lists:
        for term in set(tokens):
            doc_frequency[term] += 1
    n_docs = len(texts)
    idf = {
        term: math.log((n_docs + 1) / (df + 1)) + 1
        for term, df in doc_frequency.items()
    }
    vectors = []
    for tokens in token_lists:
        counts = Counter(tokens)
        total = sum(counts.values()) or 1
        vectors.append({
            term: (count / total) * idf[term] for term, count in counts.items()
        })
    return vectors, idf


def cosine_similarity(vec_a, vec_b):
    dot = sum(value * vec_b.get(term, 0.0) for term, value in vec_a.items())
    norm_a = math.sqrt(sum(v * v for v in vec_a.values()))
    norm_b = math.sqrt(sum(v * v for v in vec_b.values()))
    return dot / (norm_a * norm_b) if norm_a and norm_b else 0.0


def vectorize_query(question, idf):
    tokens = [term for term in tokenize(question) if term in idf]
    counts = Counter(tokens)
    total = sum(counts.values()) or 1
    return {term: (count / total) * idf[term] for term, count in counts.items()}


def retrieve(question, chunks, top_k=2, min_score=0.05):
    if top_k <= 0:
        raise ValueError("top_k 必须大于 0")
    doc_vectors, idf = build_tfidf([chunk["text"] for chunk in chunks])
    query_vector = vectorize_query(question, idf)
    if not query_vector:
        return []
    scored = []
    for chunk, doc_vector in zip(chunks, doc_vectors):
        score = cosine_similarity(query_vector, doc_vector)
        if score >= min_score:
            scored.append({**chunk, "score": score})
    return sorted(scored, key=lambda x: x["score"], reverse=True)[:top_k]


# ─────────────────────────────────────────────
# 4. 简易回答（摘取式）
# ─────────────────────────────────────────────

def split_sentences(text):
    return [s.strip() for s in re.split(r"[。！？!？\n]+", text) if s.strip()]


def simple_answer(question, retrieved):
    if not retrieved:
        return "文档中没有足够信息，无法基于当前知识库回答。", []

    question_terms = set(tokenize(question))
    candidates = []
    for item in retrieved:
        for sentence in split_sentences(item["text"]):
            sentence = re.sub(r"\[来源：[^\]]+\]", "", sentence).strip()
            if not sentence:
                continue
            sentence_terms = set(tokenize(sentence))
            overlap_count = len(question_terms & sentence_terms)
            candidates.append((overlap_count, sentence, item["source"]))
    candidates.sort(key=lambda row: row[0], reverse=True)
    useful = [row for row in candidates if row[0] > 0][:2]
    if not useful:
        return "文档中没有足够信息，无法基于当前知识库回答。", []

    answer = "；".join(sentence for _, sentence, _ in useful) + "。"
    evidence = list(dict.fromkeys(source for _, _, source in useful))
    return answer, evidence


# ─────────────────────────────────────────────
# 5. 自动提取问题
# ─────────────────────────────────────────────

def is_code_like(text):
    """过滤掉明显是代码/命令的句子"""
    code_patterns = [
        r"\b\w+\.exe\b", r"^npm ", r"^pip ", r"^git ", r"^taskkill",
        r"\\", r"/\w+\.\w+", r"\"\$schema\"", r"^python ", r"\.py",
        r"npx ", r"choco ", r"winget ",
    ]
    return any(re.search(p, text, re.IGNORECASE) for p in code_patterns)


def auto_extract_questions(text, n=3):
    """从文档中提取 n 个代表性句子作为测试问题"""
    sentences = split_sentences(text)
    # 过滤掉代码/命令类句子
    sentences = [s for s in sentences if not is_code_like(s)]
    if not sentences:
        return []
    if len(sentences) <= n:
        return sentences
    # 优先选带问号的句子
    questions = [s for s in sentences if "?" in s or "？" in s or "吗" in s]
    if len(questions) >= n:
        candidates = questions
    else:
        candidates = questions + [s for s in sentences if s not in questions]
    # 按独特词汇数排序
    candidates.sort(key=lambda s: len(set(tokenize(s))), reverse=True)
    return candidates[:n]


# ─────────────────────────────────────────────
# 6. 参数对比
# ─────────────────────────────────────────────

def eval_answer_coverage(question, answer):
    """评估回答覆盖了多少提问中的关键词"""
    q_terms = set(tokenize(question))
    a_terms = set(tokenize(answer))
    if not q_terms:
        return 0.0
    return len(q_terms & a_terms) / len(q_terms)


def run_comparison(question, raw_text, settings):
    """对给定问题遍历多组参数，输出对比结果"""
    print()
    print("=" * 68)
    print(f"  测试问题: {question}")
    print("=" * 68)

    header = (
        f"{'参数':<26} {'片段数':<8} {'Top1分':<8} {'关键词覆盖率':<12} 回答摘要"
    )
    print()
    print(header)
    print("-" * 68)

    results = []
    for cs, ov, tk in settings:
        chunks = split_text(raw_text, cs, ov)
        result = retrieve(question, chunks, top_k=tk)
        answer, sources = simple_answer(question, result)
        top1_score = result[0]["score"] if result else 0.0
        coverage = eval_answer_coverage(question, answer)

        answer_preview = answer[:40] + "..." if len(answer) > 40 else answer
        param_str = f"cs={cs} ov={ov} tk={tk}"
        print(
            f"{param_str:<26} {len(chunks):<8} "
            f"{top1_score:<8.3f} {coverage:<12.0%} {answer_preview}"
        )

        results.append({
            "chunk_size": cs, "overlap": ov, "top_k": tk,
            "n_chunks": len(chunks), "top1_score": top1_score,
            "answer": answer, "sources": sources, "coverage": coverage,
        })

    # —— 分析 ——
    print()
    print("── 分析 ──")
    best = max(results, key=lambda r: r["coverage"])
    print(
        f"  * 最佳参数: chunk_size={best['chunk_size']}, "
        f"overlap={best['overlap']}, top_k={best['top_k']}"
    )
    print(f"  * 最高关键词覆盖率: {best['coverage']:.0%}")
    print(f"  * 最佳回答: {best['answer'][:80]}...")

    if any(r["n_chunks"] < 3 for r in results):
        print("  * 注意: 某些参数下片段数过少，可能丢失上下文。")
    if results[0]["n_chunks"] != results[-1]["n_chunks"]:
        print("  * 不同 chunk_size 产生了不同数量的片段，影响检索粒度。")

    return results


# ─────────────────────────────────────────────
# 7. 交互循环
# ─────────────────────────────────────────────

def interactive_loop(raw_text, settings):
    print()
    print("=" * 68)
    print("  输入问题（直接回车退出）")
    print("=" * 68)
    while True:
        try:
            q = input("\n>> 问题: ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if not q:
            break
        run_comparison(q, raw_text, settings)


# ─────────────────────────────────────────────
# 8. 内置示例文本
# ─────────────────────────────────────────────

DEMO_TEXT = """[来源：河海大学简介（教学示例）]
河海大学是一所以水利为特色、工科为主、多学科协调发展的高校。课程实践中，学生可以从校园、专业发展和工程案例等材料中构建小型知识库。

[来源：防洪工程基础（教学示例）]
防洪工程通过堤防、水库、蓄滞洪区和预警调度等措施降低洪水灾害风险。水库在汛期需要结合来水预报、库容和下游防洪要求制定调度方案。

[来源：水资源管理基础（教学示例）]
水资源管理强调节水优先、空间均衡、系统治理和两手发力。流域管理需要统筹生活、生产和生态用水，并关注水质与水量的协同保护。

[来源：南水北调工程（教学示例）]
南水北调是优化中国水资源配置的重大工程，通过东、中、西三条调水线路缓解部分地区水资源供需矛盾。工程运行还需要重视水源保护和跨流域协调。"""


# ─────────────────────────────────────────────
# 9. 主入口
# ─────────────────────────────────────────────

def main():
    import argparse

    parser = argparse.ArgumentParser(description="最小 RAG 演示 - 参数对比工具")
    parser.add_argument(
        "--doc", "-d", type=str, default=None,
        help="知识文档路径（支持 .txt 或 .docx）",
    )
    args = parser.parse_args()

    # 默认参数对比配置
    settings = [
        (80, 20, 1),   # 基线：最严谨
        (80, 20, 2),
        (80, 20, 3),   # 增大 top_k
        (60, 10, 2),   # 更小 chunk
        (120, 30, 2),  # 更大 chunk
    ]

    # 加载文档
    if args.doc:
        print(f"[信息] 加载知识文档: {args.doc}")
        raw_text = load_document(args.doc)
    else:
        print("[信息] 未指定文档，使用内置示例知识库")
        raw_text = DEMO_TEXT

    print(f"[信息] 文档字符数: {len(raw_text)}")
    print(f"[信息] 默认参数: chunk_size=80, overlap=20")
    print(f"[信息] 参数对比组数: {len(settings)}")

    # 自动提取默认测试问题
    auto_questions = auto_extract_questions(raw_text, n=3)
    if auto_questions:
        print(f"\n[信息] 自动提取 {len(auto_questions)} 个测试问题:")
        for i, q in enumerate(auto_questions, 1):
            # 截断太长的问题
            q_display = q[:60] + "..." if len(q) > 60 else q
            print(f"       {i}. {q_display}")

        # 对每个自动提取的问题跑参数对比
        for q in auto_questions:
            run_comparison(q, raw_text, settings)

    # 进入交互模式
    interactive_loop(raw_text, settings)

    print("\n[完成] 感谢使用！")


if __name__ == "__main__":
    main()
