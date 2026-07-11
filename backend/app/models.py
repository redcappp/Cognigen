from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime 

# VERCEL FIX: Removed relative import
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    books = relationship("Book", back_populates="owner")
    quizzes = relationship("Quiz", back_populates="creator")
    question_sets = relationship("QuestionSet", back_populates="owner")

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    book_name = Column(String, nullable=False)
    status = Column(String, nullable=False, default="processing")
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="books")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    questions_data = Column(JSON, nullable=False) 
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", back_populates="quizzes")
    responses = relationship("QuizResponse", back_populates="quiz")

class QuizResponse(Base):
    __tablename__ = "quiz_responses"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    student_name = Column(String)
    score = Column(Integer)
    total_questions = Column(Integer)
    answers_data = Column(JSON, nullable=False) 
    submitted_at = Column(DateTime, default=datetime.utcnow)

    quiz = relationship("Quiz", back_populates="responses")

class QuestionSet(Base):
    __tablename__ = "question_sets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    source_summary = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="question_sets")
    questions = relationship("Question", back_populates="parent_set", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    question_set_id = Column(Integer, ForeignKey("question_sets.id"))
    question_type = Column(String, nullable=False)
    data = Column(JSON, nullable=False)
    parent_set = relationship("QuestionSet", back_populates="questions")