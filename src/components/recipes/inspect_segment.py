from pathlib import Path
text = Path("DrinksPanel.jsx").read_text()
segment = text[text.index("    </div>\r\n\r\n"):text.index("    </div>\r\n\r\n") + 60]
print(repr(segment))
