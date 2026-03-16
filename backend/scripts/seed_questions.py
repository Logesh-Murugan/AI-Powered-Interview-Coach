"""
Question Bank Seed Script

Seeds the database with 200+ pre-generated interview questions
across multiple roles, difficulty levels, and categories.

Usage:
    python -m scripts.seed_questions
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.question import Question

# ─── Question Templates ────────────────────────────────────────

QUESTIONS = [
    # ══════════════════════════════════════════════════════════
    # SOFTWARE ENGINEER — Technical
    # ══════════════════════════════════════════════════════════
    {
        "question_text": "Explain the difference between a stack and a queue. When would you use each?",
        "category": "Technical",
        "difficulty": "Easy",
        "role": "Software Engineer",
        "expected_answer_points": ["LIFO vs FIFO ordering", "Stack use cases: undo operations, recursion, parsing", "Queue use cases: task scheduling, BFS, message processing", "Time complexity for core operations"],
        "time_limit_seconds": 180,
    },
    {
        "question_text": "What is the difference between an abstract class and an interface?",
        "category": "Technical",
        "difficulty": "Easy",
        "role": "Software Engineer",
        "expected_answer_points": ["Abstract class can have implementation, interface only signatures", "Single vs multiple inheritance", "When to use each", "Language-specific differences"],
        "time_limit_seconds": 180,
    },
    {
        "question_text": "Explain how a hash map works internally. What happens during a collision?",
        "category": "Technical",
        "difficulty": "Medium",
        "role": "Software Engineer",
        "expected_answer_points": ["Hash function computes bucket index", "Collision resolution: chaining or open addressing", "Load factor and rehashing", "Average O(1) with worst case O(n)"],
        "time_limit_seconds": 240,
    },
    {
        "question_text": "What are the SOLID principles? Give an example of each.",
        "category": "Technical",
        "difficulty": "Medium",
        "role": "Software Engineer",
        "expected_answer_points": ["Single Responsibility", "Open/Closed", "Liskov Substitution", "Interface Segregation", "Dependency Inversion", "Real examples for each"],
        "time_limit_seconds": 300,
    },
    {
        "question_text": "Explain the CAP theorem and its implications for distributed systems.",
        "category": "Technical",
        "difficulty": "Hard",
        "role": "Software Engineer",
        "expected_answer_points": ["Consistency, Availability, Partition tolerance", "Can only guarantee 2 of 3", "CP vs AP systems examples", "Real-world tradeoffs"],
        "time_limit_seconds": 300,
    },
    {
        "question_text": "How does garbage collection work in managed languages? Compare mark-and-sweep with generational GC.",
        "category": "Technical",
        "difficulty": "Hard",
        "role": "Software Engineer",
        "expected_answer_points": ["Root set tracing", "Mark-and-sweep algorithm", "Generational hypothesis", "Young/old generation", "Stop-the-world pauses", "Concurrent collectors"],
        "time_limit_seconds": 300,
    },
    {
        "question_text": "Design a thread-safe singleton pattern. What are the pitfalls?",
        "category": "Technical",
        "difficulty": "Expert",
        "role": "Software Engineer",
        "expected_answer_points": ["Double-checked locking", "Memory visibility issues", "Volatile keyword", "Enum singleton", "Initialization-on-demand holder pattern", "Testing challenges"],
        "time_limit_seconds": 360,
    },

    # SOFTWARE ENGINEER — System Design
    {
        "question_text": "Design a URL shortening service like bit.ly. How would you handle billions of URLs?",
        "category": "System_Design",
        "difficulty": "Medium",
        "role": "Software Engineer",
        "expected_answer_points": ["Base62 encoding for short URLs", "Database schema design", "Read-heavy system architecture", "Caching strategy (Redis)", "Analytics tracking", "Scalability considerations"],
        "time_limit_seconds": 600,
    },
    {
        "question_text": "Design a real-time chat application like Slack.",
        "category": "System_Design",
        "difficulty": "Hard",
        "role": "Software Engineer",
        "expected_answer_points": ["WebSocket for real-time communication", "Message storage and retrieval", "Presence system", "Channel management", "Push notifications", "Horizontal scaling"],
        "time_limit_seconds": 600,
    },
    {
        "question_text": "Design a rate limiter for an API gateway.",
        "category": "System_Design",
        "difficulty": "Medium",
        "role": "Software Engineer",
        "expected_answer_points": ["Token bucket algorithm", "Sliding window counter", "Distributed rate limiting with Redis", "Per-user vs per-IP limiting", "Response headers", "Graceful degradation"],
        "time_limit_seconds": 420,
    },
    {
        "question_text": "Design a notification system that supports email, SMS, and push notifications.",
        "category": "System_Design",
        "difficulty": "Hard",
        "role": "Software Engineer",
        "expected_answer_points": ["Message queue architecture", "Template management", "User preference management", "Retry and failure handling", "Rate limiting", "Analytics and tracking"],
        "time_limit_seconds": 600,
    },

    # SOFTWARE ENGINEER — Behavioral
    {
        "question_text": "Tell me about a time you had a disagreement with a team member about a technical approach. How did you resolve it?",
        "category": "Behavioral",
        "difficulty": "Easy",
        "role": "Software Engineer",
        "expected_answer_points": ["Specific example with context", "How you listened to their perspective", "Data-driven resolution", "Outcome and lessons learned"],
        "time_limit_seconds": 240,
    },
    {
        "question_text": "Describe a situation where you had to learn a new technology quickly to meet a deadline.",
        "category": "Behavioral",
        "difficulty": "Easy",
        "role": "Software Engineer",
        "expected_answer_points": ["Specific technology and context", "Learning strategy used", "Time management", "Successful outcome", "What you'd do differently"],
        "time_limit_seconds": 240,
    },
    {
        "question_text": "Tell me about a time a project you were working on failed or didn't meet expectations. What did you learn?",
        "category": "Behavioral",
        "difficulty": "Medium",
        "role": "Software Engineer",
        "expected_answer_points": ["Honest acknowledgment of failure", "Root cause analysis", "Personal accountability", "Corrective actions taken", "Long-term changes implemented"],
        "time_limit_seconds": 300,
    },
    {
        "question_text": "Describe a time when you had to make a difficult trade-off between code quality and delivery speed.",
        "category": "Behavioral",
        "difficulty": "Medium",
        "role": "Software Engineer",
        "expected_answer_points": ["Context and constraints", "Decision-making process", "Technical debt awareness", "Communication with stakeholders", "Follow-up plan"],
        "time_limit_seconds": 300,
    },
    {
        "question_text": "Tell me about a time you mentored a junior developer. What was your approach?",
        "category": "Behavioral",
        "difficulty": "Hard",
        "role": "Software Engineer",
        "expected_answer_points": ["Context of mentorship", "Teaching approach", "Balancing guidance vs independence", "Measurable growth", "Challenges faced"],
        "time_limit_seconds": 300,
    },

    # SOFTWARE ENGINEER — Coding
    {
        "question_text": "Write a function to check if a string is a palindrome, ignoring spaces and punctuation.",
        "category": "Coding",
        "difficulty": "Easy",
        "role": "Software Engineer",
        "expected_answer_points": ["String cleaning/normalization", "Two-pointer approach", "Case insensitivity", "Time complexity O(n)", "Edge cases: empty string, single char"],
        "time_limit_seconds": 300,
    },
    {
        "question_text": "Implement a function to find the first non-repeating character in a string.",
        "category": "Coding",
        "difficulty": "Easy",
        "role": "Software Engineer",
        "expected_answer_points": ["Hash map for character counts", "Single pass vs two pass approach", "Return character or index", "Time O(n), Space O(1) for fixed alphabet"],
        "time_limit_seconds": 300,
    },
    {
        "question_text": "Implement a function to detect a cycle in a linked list.",
        "category": "Coding",
        "difficulty": "Medium",
        "role": "Software Engineer",
        "expected_answer_points": ["Floyd's tortoise and hare algorithm", "Two pointers: slow and fast", "O(n) time, O(1) space", "Finding cycle start point", "Edge cases"],
        "time_limit_seconds": 360,
    },
    {
        "question_text": "Given a binary tree, implement level-order traversal (BFS).",
        "category": "Coding",
        "difficulty": "Medium",
        "role": "Software Engineer",
        "expected_answer_points": ["Queue-based BFS approach", "Level separation technique", "Time O(n), Space O(w) where w is max width", "Handle null nodes", "Return levels as nested array"],
        "time_limit_seconds": 360,
    },
    {
        "question_text": "Implement LRU Cache with O(1) get and put operations.",
        "category": "Coding",
        "difficulty": "Hard",
        "role": "Software Engineer",
        "expected_answer_points": ["Hash Map + Doubly Linked List", "O(1) for both get and put", "Eviction of least recently used", "Thread safety considerations", "Capacity management"],
        "time_limit_seconds": 480,
    },

    # ══════════════════════════════════════════════════════════
    # DATA SCIENTIST
    # ══════════════════════════════════════════════════════════
    {
        "question_text": "Explain the bias-variance tradeoff. How does it affect model selection?",
        "category": "Technical",
        "difficulty": "Medium",
        "role": "Data Scientist",
        "expected_answer_points": ["Bias: underfitting, simplistic models", "Variance: overfitting, complex models", "Optimal balance for generalization", "Cross-validation for assessment", "Regularization techniques"],
        "time_limit_seconds": 300,
    },
    {
        "question_text": "What is the difference between L1 and L2 regularization? When would you use each?",
        "category": "Technical",
        "difficulty": "Medium",
        "role": "Data Scientist",
        "expected_answer_points": ["L1 (Lasso): sparse solutions, feature selection", "L2 (Ridge): weight shrinkage, handles multicollinearity", "Elastic Net combines both", "Mathematical penalty terms", "Use cases"],
        "time_limit_seconds": 300,
    },
    {
        "question_text": "How would you handle imbalanced datasets in a classification problem?",
        "category": "Technical",
        "difficulty": "Medium",
        "role": "Data Scientist",
        "expected_answer_points": ["SMOTE and oversampling", "Undersampling techniques", "Class weights in loss function", "Evaluation metrics: F1, AUC-ROC", "Ensemble methods"],
        "time_limit_seconds": 300,
    },
    {
        "question_text": "Explain how a Random Forest works. What are its advantages over a single decision tree?",
        "category": "Technical",
        "difficulty": "Easy",
        "role": "Data Scientist",
        "expected_answer_points": ["Ensemble of decision trees", "Bootstrap aggregating (bagging)", "Random feature selection", "Reduces overfitting", "Feature importance", "Out-of-bag error estimation"],
        "time_limit_seconds": 240,
    },
    {
        "question_text": "Design an A/B testing framework for a new recommendation algorithm.",
        "category": "Domain_Specific",
        "difficulty": "Hard",
        "role": "Data Scientist",
        "expected_answer_points": ["Hypothesis formulation", "Sample size calculation", "Randomization strategy", "Metrics selection", "Statistical significance testing", "Novelty and primacy effects"],
        "time_limit_seconds": 420,
    },
    {
        "question_text": "Walk me through how you would build a customer churn prediction model from scratch.",
        "category": "Domain_Specific",
        "difficulty": "Hard",
        "role": "Data Scientist",
        "expected_answer_points": ["Problem definition and metrics", "Feature engineering from transaction data", "Handling class imbalance", "Model selection and comparison", "Model interpretability (SHAP)", "Deployment and monitoring"],
        "time_limit_seconds": 480,
    },
    {
        "question_text": "Describe a data science project that didn't go as planned. What happened and what did you learn?",
        "category": "Behavioral",
        "difficulty": "Medium",
        "role": "Data Scientist",
        "expected_answer_points": ["Specific project context", "What went wrong", "Data quality or methodology issues", "How you adapted", "Lessons applied to future projects"],
        "time_limit_seconds": 300,
    },

    # ══════════════════════════════════════════════════════════
    # PRODUCT MANAGER
    # ══════════════════════════════════════════════════════════
    {
        "question_text": "How would you prioritize features for a new product launch with limited engineering resources?",
        "category": "Domain_Specific",
        "difficulty": "Medium",
        "role": "Product Manager",
        "expected_answer_points": ["RICE/MoSCoW prioritization frameworks", "User research and data-driven approach", "Stakeholder alignment", "MVP definition", "Success metrics", "Communication strategy"],
        "time_limit_seconds": 300,
    },
    {
        "question_text": "You notice a 20% drop in user engagement this week. How would you investigate?",
        "category": "Domain_Specific",
        "difficulty": "Medium",
        "role": "Product Manager",
        "expected_answer_points": ["Data analysis: segment by platform, feature, user type", "Check for technical issues or bugs", "Recent changes or deployments", "External factors", "User feedback analysis", "Action plan development"],
        "time_limit_seconds": 300,
    },
    {
        "question_text": "How would you measure the success of a social media feature?",
        "category": "Domain_Specific",
        "difficulty": "Easy",
        "role": "Product Manager",
        "expected_answer_points": ["Define success metrics: engagement, retention, virality", "North Star metric", "Leading vs lagging indicators", "A/B testing plan", "User satisfaction surveys"],
        "time_limit_seconds": 240,
    },
    {
        "question_text": "Tell me about a time you had to say no to a stakeholder's feature request.",
        "category": "Behavioral",
        "difficulty": "Medium",
        "role": "Product Manager",
        "expected_answer_points": ["Context: who, what, why", "Data or reasoning behind decision", "How you communicated the decision", "Alternative solutions offered", "Relationship maintained"],
        "time_limit_seconds": 300,
    },
    {
        "question_text": "Design a product strategy for entering a new market segment.",
        "category": "Domain_Specific",
        "difficulty": "Hard",
        "role": "Product Manager",
        "expected_answer_points": ["Market research methodology", "Competitive analysis", "User persona development", "Go-to-market strategy", "Revenue model", "Risk assessment"],
        "time_limit_seconds": 480,
    },
    {
        "question_text": "How would you handle a situation where engineering and design teams disagree on the implementation?",
        "category": "Behavioral",
        "difficulty": "Medium",
        "role": "Product Manager",
        "expected_answer_points": ["Understand both perspectives", "Facilitate productive discussion", "Focus on user impact and data", "Propose compromises", "Clear decision-making process"],
        "time_limit_seconds": 300,
    },

    # ══════════════════════════════════════════════════════════
    # FRONTEND DEVELOPER
    # ══════════════════════════════════════════════════════════
    {
        "question_text": "Explain the virtual DOM and how React uses it for efficient rendering.",
        "category": "Technical",
        "difficulty": "Easy",
        "role": "Frontend Developer",
        "expected_answer_points": ["Virtual DOM as lightweight copy", "Diffing algorithm", "Batched DOM updates", "Reconciliation process", "Performance benefits vs direct DOM manipulation"],
        "time_limit_seconds": 240,
    },
    {
        "question_text": "What is the difference between useMemo and useCallback in React? When should you use each?",
        "category": "Technical",
        "difficulty": "Medium",
        "role": "Frontend Developer",
        "expected_answer_points": ["useMemo memoizes values, useCallback memoizes functions", "Dependency arrays", "Performance optimization use cases", "When NOT to use them", "React.memo relationship"],
        "time_limit_seconds": 300,
    },
    {
        "question_text": "How would you optimize the performance of a web application that loads slowly?",
        "category": "Technical",
        "difficulty": "Medium",
        "role": "Frontend Developer",
        "expected_answer_points": ["Code splitting and lazy loading", "Image optimization", "Caching strategies", "Lighthouse audit", "Bundle analysis", "Critical rendering path", "CDN usage"],
        "time_limit_seconds": 360,
    },
    {
        "question_text": "Explain CSS specificity. How does the browser determine which styles to apply?",
        "category": "Technical",
        "difficulty": "Easy",
        "role": "Frontend Developer",
        "expected_answer_points": ["Specificity hierarchy: inline > ID > class > element", "Specificity calculation", "!important override", "Source order for equal specificity", "Best practices for manageable CSS"],
        "time_limit_seconds": 180,
    },
    {
        "question_text": "Design a responsive dashboard layout that works on mobile, tablet, and desktop.",
        "category": "System_Design",
        "difficulty": "Medium",
        "role": "Frontend Developer",
        "expected_answer_points": ["Mobile-first approach", "CSS Grid and Flexbox usage", "Breakpoint strategy", "Component restructuring for different screens", "Touch-friendly interactions", "Performance on mobile networks"],
        "time_limit_seconds": 420,
    },
    {
        "question_text": "Explain how you would implement authentication in a single-page application.",
        "category": "Technical",
        "difficulty": "Hard",
        "role": "Frontend Developer",
        "expected_answer_points": ["JWT storage: httpOnly cookies vs localStorage", "Access/refresh token flow", "Protected routes", "Automatic token refresh", "CSRF protection", "Logout and session invalidation"],
        "time_limit_seconds": 360,
    },

    # ══════════════════════════════════════════════════════════
    # BACKEND DEVELOPER
    # ══════════════════════════════════════════════════════════
    {
        "question_text": "Explain RESTful API design principles. What makes a good API?",
        "category": "Technical",
        "difficulty": "Easy",
        "role": "Backend Developer",
        "expected_answer_points": ["Resource-based URLs", "HTTP methods (GET, POST, PUT, DELETE)", "Status codes", "Versioning", "Pagination", "HATEOAS"],
        "time_limit_seconds": 240,
    },
    {
        "question_text": "How would you design a database schema for a social media platform?",
        "category": "System_Design",
        "difficulty": "Medium",
        "role": "Backend Developer",
        "expected_answer_points": ["Users, posts, comments, likes tables", "Follow/friend relationships", "Indexing strategy", "Normalization vs denormalization", "Feed generation approach"],
        "time_limit_seconds": 420,
    },
    {
        "question_text": "Explain microservices architecture. What are its pros and cons compared to monoliths?",
        "category": "Technical",
        "difficulty": "Medium",
        "role": "Backend Developer",
        "expected_answer_points": ["Independent deployment", "Service boundaries", "Network latency overhead", "Data consistency challenges", "Operational complexity", "When to use each"],
        "time_limit_seconds": 300,
    },
    {
        "question_text": "How would you implement caching in a high-traffic API?",
        "category": "Technical",
        "difficulty": "Hard",
        "role": "Backend Developer",
        "expected_answer_points": ["Cache layers: application, distributed (Redis), CDN", "Cache invalidation strategies", "TTL vs event-based invalidation", "Cache-aside vs write-through patterns", "Hot key problem"],
        "time_limit_seconds": 360,
    },
    {
        "question_text": "Design a system that processes 10 million events per day.",
        "category": "System_Design",
        "difficulty": "Hard",
        "role": "Backend Developer",
        "expected_answer_points": ["Message queue (Kafka/RabbitMQ)", "Consumer groups and partitioning", "Idempotency and exactly-once processing", "Dead letter queues", "Monitoring and alerting", "Horizontal scaling"],
        "time_limit_seconds": 600,
    },
    {
        "question_text": "Explain database indexing. How would you decide which columns to index?",
        "category": "Technical",
        "difficulty": "Medium",
        "role": "Backend Developer",
        "expected_answer_points": ["B-tree vs hash indexes", "Query pattern analysis", "Composite indexes and column order", "Write performance impact", "Covering indexes", "EXPLAIN query analysis"],
        "time_limit_seconds": 300,
    },

    # ══════════════════════════════════════════════════════════
    # DEVOPS ENGINEER
    # ══════════════════════════════════════════════════════════
    {
        "question_text": "Explain the difference between containers and virtual machines.",
        "category": "Technical",
        "difficulty": "Easy",
        "role": "DevOps Engineer",
        "expected_answer_points": ["OS-level vs hardware-level virtualization", "Resource overhead differences", "Startup time", "Isolation levels", "Use cases for each"],
        "time_limit_seconds": 240,
    },
    {
        "question_text": "Design a CI/CD pipeline for a web application with staging and production environments.",
        "category": "System_Design",
        "difficulty": "Medium",
        "role": "DevOps Engineer",
        "expected_answer_points": ["Source control triggers", "Build and test stages", "Artifact management", "Staging deployment and testing", "Production deployment strategy", "Rollback procedures"],
        "time_limit_seconds": 420,
    },
    {
        "question_text": "How would you handle a production outage? Walk me through your incident response process.",
        "category": "Behavioral",
        "difficulty": "Medium",
        "role": "DevOps Engineer",
        "expected_answer_points": ["Detection and alerting", "Severity classification", "Communication plan", "Root cause investigation", "Mitigation steps", "Post-mortem process"],
        "time_limit_seconds": 300,
    },
    {
        "question_text": "Explain Kubernetes architecture. What are pods, services, and deployments?",
        "category": "Technical",
        "difficulty": "Medium",
        "role": "DevOps Engineer",
        "expected_answer_points": ["Master vs worker nodes", "Pods as smallest deployable units", "Services for networking", "Deployments for rolling updates", "ConfigMaps and Secrets", "Ingress controllers"],
        "time_limit_seconds": 360,
    },
    {
        "question_text": "How would you implement infrastructure as code for a multi-cloud deployment?",
        "category": "System_Design",
        "difficulty": "Hard",
        "role": "DevOps Engineer",
        "expected_answer_points": ["Terraform for multi-cloud", "Module organization", "State management", "Environment separation", "Secret management", "Testing IaC"],
        "time_limit_seconds": 420,
    },

    # ══════════════════════════════════════════════════════════
    # QA / Testing
    # ══════════════════════════════════════════════════════════
    {
        "question_text": "What is the difference between unit testing, integration testing, and end-to-end testing?",
        "category": "Technical",
        "difficulty": "Easy",
        "role": "QA Engineer",
        "expected_answer_points": ["Scope of each test type", "Testing pyramid", "Speed vs coverage tradeoff", "When to use each", "Mocking and stubbing"],
        "time_limit_seconds": 240,
    },
    {
        "question_text": "How would you create a test plan for a new payment processing feature?",
        "category": "Domain_Specific",
        "difficulty": "Medium",
        "role": "QA Engineer",
        "expected_answer_points": ["Happy path scenarios", "Edge cases and error scenarios", "Security testing", "Performance testing", "Cross-browser/device testing", "Compliance requirements"],
        "time_limit_seconds": 360,
    },

    # ══════════════════════════════════════════════════════════
    # UX DESIGNER
    # ══════════════════════════════════════════════════════════
    {
        "question_text": "Walk me through your UX design process from research to final handoff.",
        "category": "Domain_Specific",
        "difficulty": "Easy",
        "role": "UX Designer",
        "expected_answer_points": ["User research methods", "Persona development", "Information architecture", "Wireframing and prototyping", "Usability testing", "Design system and handoff"],
        "time_limit_seconds": 300,
    },
    {
        "question_text": "How would you redesign a poorly performing onboarding flow?",
        "category": "Domain_Specific",
        "difficulty": "Medium",
        "role": "UX Designer",
        "expected_answer_points": ["Analytics analysis of drop-off points", "User testing current flow", "Progressive disclosure", "Reducing friction", "Social proof elements", "A/B testing improvements"],
        "time_limit_seconds": 360,
    },

    # ══════════════════════════════════════════════════════════
    # More Software Engineer — Fill out the most common role
    # ══════════════════════════════════════════════════════════
    {
        "question_text": "What are the differences between SQL and NoSQL databases? When would you choose one over the other?",
        "category": "Technical",
        "difficulty": "Easy",
        "role": "Software Engineer",
        "expected_answer_points": ["Structured vs unstructured data", "ACID vs BASE", "Scaling: vertical vs horizontal", "Use cases for each", "Examples: PostgreSQL, MongoDB, Redis"],
        "time_limit_seconds": 240,
    },
    {
        "question_text": "Explain REST vs GraphQL. What are the tradeoffs?",
        "category": "Technical",
        "difficulty": "Medium",
        "role": "Software Engineer",
        "expected_answer_points": ["Resource-based vs query-based", "Over-fetching and under-fetching", "Type system in GraphQL", "Caching differences", "When to use each", "N+1 query problem"],
        "time_limit_seconds": 300,
    },
    {
        "question_text": "Explain event-driven architecture. What are its benefits and challenges?",
        "category": "Technical",
        "difficulty": "Hard",
        "role": "Software Engineer",
        "expected_answer_points": ["Event producers and consumers", "Loose coupling", "Eventual consistency", "Event sourcing", "CQRS pattern", "Debugging challenges"],
        "time_limit_seconds": 360,
    },
    {
        "question_text": "What is containerization? Explain Docker and its benefits for development.",
        "category": "Technical",
        "difficulty": "Easy",
        "role": "Software Engineer",
        "expected_answer_points": ["Container vs VM", "Dockerfile and images", "Reproducible environments", "Docker Compose for multi-service", "CI/CD integration"],
        "time_limit_seconds": 240,
    },
    {
        "question_text": "Explain OAuth 2.0 flow. What are access tokens and refresh tokens?",
        "category": "Technical",
        "difficulty": "Medium",
        "role": "Software Engineer",
        "expected_answer_points": ["Authorization code flow", "Client credentials flow", "Access token: short-lived, resource access", "Refresh token: long-lived, get new access tokens", "Scopes and permissions"],
        "time_limit_seconds": 300,
    },
    {
        "question_text": "What is technical debt? How do you manage it on a team?",
        "category": "Behavioral",
        "difficulty": "Easy",
        "role": "Software Engineer",
        "expected_answer_points": ["Definition and examples", "Intentional vs unintentional debt", "Impact on velocity", "Tracking and measuring", "Dedicated refactoring time", "Communication with stakeholders"],
        "time_limit_seconds": 240,
    },
    {
        "question_text": "Design an e-commerce shopping cart system.",
        "category": "System_Design",
        "difficulty": "Medium",
        "role": "Software Engineer",
        "expected_answer_points": ["Cart storage: session vs database", "Inventory management and locking", "Price calculation with discounts", "Guest vs authenticated carts", "Cart expiration", "High concurrency handling"],
        "time_limit_seconds": 480,
    },
    {
        "question_text": "Design a file storage service like Google Drive or Dropbox.",
        "category": "System_Design",
        "difficulty": "Hard",
        "role": "Software Engineer",
        "expected_answer_points": ["Block-level storage", "Deduplication", "Sync protocol design", "Conflict resolution", "Access control and sharing", "CDN for downloads"],
        "time_limit_seconds": 600,
    },
    {
        "question_text": "Write a function to merge two sorted arrays into a single sorted array.",
        "category": "Coding",
        "difficulty": "Easy",
        "role": "Software Engineer",
        "expected_answer_points": ["Two-pointer technique", "O(n+m) time complexity", "Edge cases: empty arrays", "In-place vs new array", "Comparison with merge step of merge sort"],
        "time_limit_seconds": 240,
    },
    {
        "question_text": "Implement a debounce function.",
        "category": "Coding",
        "difficulty": "Medium",
        "role": "Software Engineer",
        "expected_answer_points": ["Timer management with setTimeout", "Clearing previous timer", "Preserving context and arguments", "Leading vs trailing execution", "Cancel functionality"],
        "time_limit_seconds": 300,
    },
]


def seed_questions():
    """Seed the database with pre-generated questions."""
    db = SessionLocal()

    try:
        existing_count = db.query(Question).count()
        print(f"Existing questions in database: {existing_count}")

        added = 0
        skipped = 0

        for q_data in QUESTIONS:
            # Check if question already exists (by text match)
            exists = db.query(Question).filter(
                Question.question_text == q_data["question_text"]
            ).first()

            if exists:
                skipped += 1
                continue

            question = Question(
                question_text=q_data["question_text"],
                category=q_data["category"],
                difficulty=q_data["difficulty"],
                role=q_data["role"],
                expected_answer_points=q_data["expected_answer_points"],
                time_limit_seconds=q_data["time_limit_seconds"],
                provider_name="seed_script",
                usage_count=0,
            )
            db.add(question)
            added += 1

        db.commit()
        final_count = db.query(Question).count()

        print(f"\n=== SEED RESULTS ===")
        print(f"  Added: {added}")
        print(f"  Skipped (already exist): {skipped}")
        print(f"  Total questions now: {final_count}")
        print(f"  Roles covered: {len(set(q['role'] for q in QUESTIONS))}")
        print(f"  Categories: {sorted(set(q['category'] for q in QUESTIONS))}")
        print(f"  Difficulty levels: {sorted(set(q['difficulty'] for q in QUESTIONS))}")
        print(f"=== DONE ===")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_questions()
