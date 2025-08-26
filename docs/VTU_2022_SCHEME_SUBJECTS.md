# 📘 VTU 2022 Scheme — Theory Subjects (CSE, ISE, ECE, Sem 3–6)

Based on official VTU syllabus documents, here are the **theory subjects only** for **ISE, CSE, and ECE branches** under the **2022 scheme**, covering the 3rd, 4th, 5th, and 6th semesters.

---

## CSE — Computer Science & Engineering

### 3rd Semester

| Code    | Subject Name                          |
| ------- | ------------------------------------- |
| BCS301  | Discrete Mathematical Structures      |
| BCS302  | Data Structures and Applications      |
| BCS303  | Computer Organization & Architecture  |
| BCS304  | Object Oriented Programming with Java |
| BSCK307 | Social Connect and Responsibility     |

### 4th Semester

| Code    | Subject Name                    |
| ------- | ------------------------------- |
| BCS401  | Analysis & Design of Algorithms |
| BCS402  | Microcontrollers                |
| BCS403  | Database Management Systems     |
| BBOK407 | Biology For Engineers           |
| BUHK408 | Universal Human Values Course   |

### 5th Semester

| Code    | Subject Name                              |
| ------- | ----------------------------------------- |
| BCS501  | Software Engineering & Project Management |
| BCS502  | Computer Networks                         |
| BCS503  | Theory of Computation                     |
| BRMK557 | Research Methodology and IPR              |
| BESK508 | Environmental Studies                     |

### 6th Semester

| Code    | Subject Name                        |
| ------- | ----------------------------------- |
| BCS601  | Cloud Computing (Open Stack/Google) |
| BCS602  | Machine Learning                    |
| BCS613x | Professional Elective Course        |
| BCS654x | Open Elective Course                |

---

## ISE — Information Science & Engineering

### 3rd Semester

| Code    | Subject Name                          |
| ------- | ------------------------------------- |
| BIS301  | Discrete Mathematical Structures      |
| BIS302  | Data Structures and Applications      |
| BIS303  | Computer Organization & Architecture  |
| BIS304  | Object Oriented Programming with Java |
| BSCK307 | Social Connect and Responsibility     |

### 4th Semester

| Code    | Subject Name                    |
| ------- | ------------------------------- |
| BIS401  | Analysis & Design of Algorithms |
| BIS402  | Database Management Systems     |
| BIS403  | Computer Networks               |
| BBOK407 | Biology For Engineers           |
| BUHK408 | Universal Human Values Course   |

### 5th Semester

| Code    | Subject Name                              |
| ------- | ----------------------------------------- |
| BIS501  | Software Engineering & Project Management |
| BIS502  | Web Programming                           |
| BIS503  | Theory of Computation                     |
| BRMK557 | Research Methodology and IPR              |
| BESK508 | Environmental Studies                     |

### 6th Semester

| Code    | Subject Name                     |
| ------- | -------------------------------- |
| BIS601  | Information Storage & Management |
| BIS602  | Data Mining & Data Warehousing   |
| BIS613x | Professional Elective Course     |
| BIS654x | Open Elective Course             |

---

## ECE — Electronics & Communication Engineering

### 3rd Semester

| Code      | Subject Name                           |
| --------- | -------------------------------------- |
| BMATEC301 | Mathematics-III (Transforms & Signals) |
| BEC302    | Applied Electronic Circuits            |
| BEC303    | Digital Electronic Circuits            |
| BEC304    | Network Analysis                       |
| BSCK307   | Social Connect and Responsibility      |

### 4th Semester

| Code    | Subject Name                        |
| ------- | ----------------------------------- |
| BEC401  | Electromagnetics Theory             |
| BEC402  | Principles of Communication Systems |
| BEC403  | Control Systems                     |
| BBOK407 | Biology For Engineers               |
| BUHK408 | Universal Human Values Course       |

### 5th Semester

| Code    | Subject Name                                     |
| ------- | ------------------------------------------------ |
| BEC501  | Technological Innovation Mgmt & Entrepreneurship |
| BEC502  | Digital Signal Processing                        |
| BEC503  | Digital Communication                            |
| BRMK557 | Research Methodology and IPR                     |
| BESK508 | Environmental Studies                            |

### 6th Semester

| Code    | Subject Name                 |
| ------- | ---------------------------- |
| BEC601  | Embedded System Design       |
| BEC602  | VLSI Design and Testing      |
| BEC613x | Professional Elective Course |
| BEC654x | Open Elective Course         |

---

## 🔎 Key Observations

### **Common Subjects Across All Branches**:

* **3rd Semester**: Social Connect and Responsibility (BSCK307)
* **4th Semester**: Biology For Engineers (BBOK407), Universal Human Values (BUHK408)
* **5th Semester**: Research Methodology & IPR (BRMK557), Environmental Studies (BESK508)
* **6th Semester**: Professional Elective + Open Elective

### **Branch-Specific Patterns**:

* **CSE & ISE** share many CS fundamentals but diverge in 5th–6th sem specializations
* **ECE** follows electronics/communication-heavy track
* Subject codes follow pattern **B[Branch]xxx** where Branch = CS, IS, EC

### **Coverage Statistics**:

* **Total theory subjects**: 57 across 3 branches (19 per branch)
* **Subject distribution**: Mix of core engineering, branch-specific, and interdisciplinary subjects
* **Elective flexibility**: 6th semester includes both professional and open electives for specialization

### **VTU EduMate Integration**:

* All subjects are mapped in [`data/syllabus/vtu_syllabus.json`](../data/syllabus/vtu_syllabus.json)
* Subject-specific content available in [`data/syllabus_resources/`](../data/syllabus_resources/)
* RAG system can answer questions for any of these 57 subjects
* ML processor provides VTU-specific question complexity analysis

---

## 📚 Implementation in VTU EduMate

### Subject Data Structure
```json
{
  "2022": {
    "CSE": {
      "3": {
        "Discrete Mathematical Structures": {
          "code": "BCS301",
          "credits": 4,
          "modules": [...],
          "keywords": ["discrete math", "graph theory", "combinatorics"]
        }
      }
    }
  }
}
```

### API Integration
```javascript
// Get all subjects for a specific branch and semester
const subjects = getSubjectsByBranchSemester("2022", "CSE", "6");
// Returns: ["Cloud Computing", "Machine Learning", ...]

// ML analysis considers VTU subject codes
const analysis = analyzeQuestionForSubject("BCS602", question);
// Returns VTU-specific complexity and marks recommendation
```

### RAG System Coverage
- **Sample Content**: Professional content for BIS601, BCS602, BME654B, BIS613D
- **Expandable**: Easy addition of new subject materials
- **Citation Mapping**: Links answers back to specific VTU subject codes
- **Context Awareness**: Understands VTU exam patterns and marking schemes

---

**📝 Note**: This document serves as the official reference for VTU 2022 scheme theory subjects integrated into VTU EduMate. For practical implementations and code examples, refer to the main technical documentation.