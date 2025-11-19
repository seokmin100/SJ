CREATE TABLE USER (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    auth_provider VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE CHAT_SESSION (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    diagnosed_type VARCHAR(100),
    status VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES USER(user_id)
);

CREATE TABLE CHAT_MESSAGE (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    sender VARCHAR(50) NOT NULL,
    message_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES CHAT_SESSION(session_id)
);

CREATE TABLE CONTRACT (
    contract_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    contract_name VARCHAR(255),
    lessor_name VARCHAR(255),
    lessor_address VARCHAR(255),
    lessee_name VARCHAR(255),
    lessee_address VARCHAR(255),
    property_address VARCHAR(255),
    deposit_amount BIGINT,
    lease_start_date DATE,
    lease_end_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USER(user_id)
);

CREATE TABLE DOCUMENT (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    contract_id INT NOT NULL,
    document_type VARCHAR(100),
    generated_content LONGTEXT,
    edited_content LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES CONTRACT(contract_id)
);

CREATE TABLE PROCESS_STEP (
    step_id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    step_name VARCHAR(255),
    status VARCHAR(100),
    completed_at DATETIME,
    FOREIGN KEY (document_id) REFERENCES DOCUMENT(document_id)
);
