use z_ast::{Element, Node, Annotation};

// Temporary regex-based parser until PEG is integrated
pub fn parse_source(src: &str) -> Result<Element, String> {
    let mut children = Vec::new();

    // Find top-level blocks like "next MySite {", "swift MyApp {", etc.
    for line in src.lines() {
        let trimmed = line.trim();
        if let Some(caps) = regex::Regex::new(r"^([a-z]+)\s+([A-Za-z0-9_]+)\s*\{")
            .unwrap()
            .captures(trimmed)
        {
            let target_type = caps[1].to_string();
            let app_name = caps[2].to_string();

            children.push(Node::Element(Element {
                name: format!("{}:{}", target_type, app_name), // Store as "target:name"
                annotations: Vec::new(),
                children: Vec::new(),
            }));
        }
    }

    Ok(Element {
        name: "Program".to_string(),
        annotations: Vec::new(),
        children,
    })
}