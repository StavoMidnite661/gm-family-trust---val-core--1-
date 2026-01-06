# Agent Architectural Patterns

> This document synthesizes various architectural patterns for software "Agents" based on a review of multiple codebases. It serves as a knowledge base or "memory boost" for the AI Cabinet framework.

---

## 1. Abstract Base Class Pattern

This pattern defines a generic interface that all agents must adhere to. It's useful for systems that need to handle different types of agents in a uniform way.

### Snippet Analysis
```python
class Agent:
    """Base class for the agent"""

    def __init__(self, *args: Any) -> None:
        pass

    def next_action(
        self, trajectory: Trajectory, intent: str, meta_data: Any
    ) -> Action:
        """Predict the next action given the observation"""
        raise NotImplementedError

    def reset(
        self,
        test_config_file: str,
    ) -> None:
        raise NotImplementedError
```
- **Key Concepts:** Defines a contract with methods like `next_action` and `reset`.
- **Purpose:** Ensures that any concrete agent implementation will have a predictable structure. The `NotImplementedError` forces subclasses to provide their own logic.
- **Use Case:** A simulation environment where different agent strategies can be swapped out for testing.

---

## 2. LLM-Powered Agent Pattern

This pattern shows an agent that is fundamentally powered by a Large Language Model (LLM) and its tokenizer.

### Snippet Analysis
```python
class Agent:

    def __init__(
        self,
        model: PreTrainedModel,
        tokenizer: PreTrainedTokenizerBase,
    ) -> None:
        self.model = model
        self.tokenizer = tokenizer
```
- **Key Concepts:** The agent's core components are a `model` (like BERT, GPT) and a `tokenizer`.
- **Purpose:** The agent's "intelligence" comes from the pretrained model. Its actions would involve encoding input, feeding it to the model, and decoding the output.
- **Use Case:** Chatbots, text-based analysis tools, or any agent that needs to understand and generate natural language.

---

## 3. Game-Playing Agent Pattern (Stateful, Role-Based)

This pattern is designed for agents operating within a structured, multi-player game environment like Avalon.

### Snippet Analysis
```python
class Agent:
    def __init__(self, id: int, role: int, config: AvalonBasicConfig) -> None:
        self.id = id
        self.role = role
        self.config = config

    def propose_team(self, mission_id: int) -> frozenset[int]:
        raise NotImplementedError
    
    def vote_on_team(self, mission_id: int, team: frozenset[int]) -> bool:
        raise NotImplementedError
    
    def vote_on_mission(self, mission_id: int, quest_team: frozenset[int]) -> bool:
        raise NotImplementedError
    
    def assassinate(self, num_players: int) -> int:
        raise NotImplementedError
```
- **Key Concepts:** The agent has a specific `id` and `role` within a game defined by a `config`. Its actions (`propose_team`, `vote_on_team`) are specific to the game's rules.
- **Purpose:** To encapsulate the logic and state of a player in a complex game, making decisions based on the game state and its own role (e.g., spy vs. resistance).
- **Use Case:** Implementing AI opponents or collaborators in board games, strategy games, or social deduction games.

---

## 4. Reinforcement Learning (RL) Agent Pattern

This is a highly complex pattern for an agent that learns from interaction with an environment, typically for web navigation or similar tasks.

### Snippet Analysis
```python
class Agent:
    def __init__(self, args):
        # tokenizer, network (e.g., RNN/BERT), optimizer
        self.tokenizer = AutoTokenizer.from_pretrained(...)
        self.network = RCDQN(...) 
        self.optimizer = torch.optim.Adam(...)

    def build_state(self, ob, info):
        # ...
        
    def act(self, states, valid_acts, method):
        # ... uses the network to predict action values
    
    def update(self, transitions, last_values, step=None, rewards_invdy=None):
        # ... calculates loss and updates the network via backpropagation
```
- **Key Concepts:** This agent has a neural `network`, an `optimizer`, and `act`/`update` methods. It `build_state` from observations, `act`s based on policy (e.g., greedy, softmax), and `update`s its internal network based on rewards.
- **Purpose:** To train an agent using reinforcement learning techniques (like Q-learning, Policy Gradients) to achieve a goal in a dynamic environment.
- **Use Case:** Web automation agents (e.g., webshop browsing), game-playing bots that learn from experience, or robotics control systems.

---

## 5. Agent Infrastructure & Deployment Patterns

These snippets are not about the agent's internal logic, but about the framework for managing, tracing, and deploying them.

### Snippet 1: Agent Span (Tracing)
```python
def agent_span(...):
    # ...
    return GLOBAL_TRACE_PROVIDER.create_span(
        span_data=AgentSpanData(name=name, handoffs=handoffs, tools=tools, output_type=output_type),
        # ...
    )
```
- **Purpose:** This function is part of a tracing or observability framework. It creates a "span," which is a logical unit of work representing a single agent's operation. This is crucial for debugging and monitoring complex multi-agent systems.

### Snippet 2: Agent Engine (Deployment)
```python
def to_agent_engine(
    *,
    agent_folder: str,
    ...
):
  # ...
  agent_engines.create(
        agent_engine=agent_engine,
        # ...
    )
```
- **Purpose:** This function is a deployment script. It takes an `agent_folder` containing the agent's source code and deploys it to a cloud platform (specifically Vertex AI Agent Engines). It handles packaging dependencies, setting environment variables, and creating the cloud resource.

### Snippet 3: Agent Configuration
```python
class AgentConfig:
    # ...
    max_turns: int
    env_name: str 
    rollout_strategy: str
    # ...
```
- **Purpose:** A configuration class (likely using `dataclasses` or `pydantic`) to define all the parameters an agent needs to operate, such as conversation limits, environment details, and strategy settings. This separates configuration from code.

### Snippet 4: Agent Composition
```python
async def get_agent_async():
    # ...
    tools, exit_stack = await get_tools_async()
    planner = find_agent(root_agent, "planning_agent")
    if planner:
        planner.tools.extend(tools)
    # ...
```
- **Purpose:** This shows a pattern of agent composition, where a "root agent" is composed of sub-agents (like a "planning_agent"). It also demonstrates dynamically extending an agent's capabilities by adding `tools` to it at runtime. This is very similar to the AI Cabinet's philosophy.

---

## 6. Agent Memory Patterns

An agent's ability to maintain context and recall past information is crucial for complex tasks. Memory can be categorized into two main types:

### A. Short-Term Memory (Working Memory)
This is the most basic form of memory, implemented as the **context window** of the Large Language Model.

- **Mechanism:** The conversation history (previous prompts, actions, and observations) is passed back to the LLM with every new request.
- **Pros:** Fast, readily available, highly relevant to the immediate task.
- **Cons:** Limited in size (e.g., a few thousand to over a million tokens). Information is lost once it scrolls out of the context window. It is not persistent between separate agent sessions.

### B. Long-Term Memory (Persistent Memory)
To overcome the limitations of the context window, advanced agents use an external database to store and retrieve information over long periods.

#### The Vector Database Pattern
This is the most common and powerful pattern for storing and retrieving memories based on conceptual relevance, not just keywords.

- **Mechanism:**
    1.  **Store:** An experience (e.g., a user's request, an observation from a tool, a thought the agent had) is saved as a chunk of text. This text is converted into a numerical vector (an "embedding") by an embedding model. This vector is then stored in a specialized **vector database** (like Chroma, FAISS, or Pinecone).
    2.  **Retrieve:** When the agent needs to recall relevant information to perform a task, its current query or thought is also converted into a vector.
    3.  The agent then performs a **similarity search** on the vector database to find the stored vectors (memories) that are "closest" or most semantically similar to its current query vector.
    4.  **Augment:** The text of the top N most relevant memories is retrieved from the database and injected back into the LLM's short-term context window, giving it relevant "memories" to complete its current task.

- **High-Level Pseudo-code Example:**
```python
# Simplified example of the Vector DB memory pattern

# 1. Initialize components
from some_vector_db import VectorDatabase
from some_embedding_model import EmbeddingModel

memory_db = VectorDatabase("agent_long_term_memory")
embedding_model = EmbeddingModel()

def store_memory(text_to_remember: str):
    """Encodes text into a vector and stores it."""
    print(f"Storing memory: '{text_to_remember}'")
    vector = embedding_model.embed(text_to_remember)
    memory_db.add(vector, text_to_remember)

def retrieve_relevant_memories(current_query: str, top_k: int = 3) -> list[str]:
    """Finds the most relevant memories for a given query."""
    print(f"Searching for memories related to: '{current_query}'")
    query_vector = embedding_model.embed(current_query)
    results = memory_db.similarity_search(query_vector, k=top_k)
    return [result.text for result in results]

# --- Agent's ReAct Loop ---
task = "Find the email address for the 'VAL Core' project lead."

# Agent doesn't know the answer, so it consults its memory
relevant_memories = retrieve_relevant_memories(task)

# The retrieved memories are added to the LLM prompt
prompt = f"""
You are a helpful assistant. Here are some relevant memories from your past:
{relevant_memories}

Based on these memories and your general knowledge, answer the following question:
Question: {task}
"""
# llm.generate(prompt) -> "The project lead is on the App.tsx file..." (hypothetical)
```
- **Use Case:** Giving an agent a persistent memory of past projects, user preferences, or successful solutions to problems it has solved before. It allows the agent to learn and improve over time.
