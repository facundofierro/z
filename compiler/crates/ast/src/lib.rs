use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Element {
    pub name: String,
    pub annotations: Vec<Annotation>,
    pub children: Vec<Node>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Annotation {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "kind")]
pub enum Node {
    Element(Element),
    ChildLine { modifier: Option<String>, id: String },
    KeyValue { key: String, value: String },
}