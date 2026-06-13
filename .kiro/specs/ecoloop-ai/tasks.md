# Implementation Plan: EcoLoop AI

## Overview

Implementation of EcoLoop AI, an AI-powered sustainability platform for Amazon HackOn 2026. The platform uses a React + Tailwind CSS frontend, FastAPI backend, Amazon S3 for image storage, Amazon Bedrock for AI inference (multimodal + text), and DynamoDB for data persistence. The core assessment intelligence is delivered through a 5-agent sequential pipeline: Vision Agent → Valuation Agent → Decision Agent → Sustainability Agent → Buyer Matching Agent. Image upload uses a simplified direct-to-backend pattern (`POST /api/upload`) for the MVP.

## Tasks

- [ ] 1. Project Setup and Infrastructure
  - [ ] 1.1 Initialize React frontend project with Vite, Tailwind CSS, and project structure (pages, components, services, utils directories)
    - _Requirements: 1.1, 1.5, 1.6_
  - [ ] 1.2 Initialize FastAPI backend project with project structure (routers, services, agents, models, config directories) and requirements.txt including boto3, fastapi, uvicorn, python-multipart, pydantic
    - _Requirements: 10.1, 10.2_
  - [ ] 1.3 Configure AWS SDK (boto3) with S3, Bedrock Runtime, and DynamoDB clients in the backend config module
    - _Requirements: 1.2, 3.1, 6.3_
  - [ ] 1.4 Create DynamoDB table definitions (Assessments table with assessment_id PK and user_session_id SK; UserMetrics table with user_session_id PK)
    - _Requirements: 6.3, 7.2, 11.3_
  - [ ] 1.5 Configure CORS middleware in FastAPI to allow frontend origin
    - _Requirements: 12.1_
  - [ ] 1.6 Set up environment variable configuration for AWS region, S3 bucket name, Bedrock model IDs (multimodal and text), and DynamoDB table names
    - _Requirements: 10.1, 11.1_

- [ ] 2. Image Upload Feature (Simplified Direct Upload)
  - [ ] 2.1 Create backend endpoint `POST /api/upload` that accepts multipart/form-data, validates file type (JPEG/PNG/WebP) and size (max 10MB), uploads to S3 with a unique key, and returns `image_key` and `preview_url` (pre-signed download URL with 15-min expiry)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 12.2, 12.3_
  - [ ] 2.2 Create frontend Upload Page component with drag-and-drop zone, file input, client-side validation (type and size), upload progress indicator, and image preview display
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6_
  - [ ] 2.3 Implement frontend upload service function that sends file directly to backend via multipart/form-data POST and handles response (image_key, preview_url) or error display
    - _Requirements: 1.2, 1.6, 10.1_
  - [ ]* 2.4 Write property test for file format validation
    - **Property 1: File Format Validation**
    - **Validates: Requirements 1.1, 1.4**

- [ ] 3. Product Metadata Form
  - [ ] 3.1 Create frontend Product Form component with category dropdown (Electronics, Clothing, Furniture, Books, Toys, Appliances, Sports Equipment), age input (numeric, 0-240 months), and price input (numeric, > 0)
    - _Requirements: 2.1, 2.5_
  - [ ] 3.2 Implement client-side form validation with inline error messages for empty fields, out-of-range age, and invalid price
    - _Requirements: 2.2, 2.3, 2.4, 2.6_
  - [ ] 3.3 Create backend Pydantic model for product metadata with server-side validation rules (category from allowed list, age 0-240, price > 0)
    - _Requirements: 2.2, 2.3, 2.4, 12.3_
  - [ ] 3.4 Integrate upload and form components into a unified assessment submission flow that collects image_key and metadata before triggering assessment
    - _Requirements: 3.1_
  - [ ]* 3.5 Write property test for product metadata validation
    - **Property 2: Product Metadata Validation**
    - **Validates: Requirements 2.2, 2.3, 2.4**

- [ ] 4. Checkpoint - Verify upload and form infrastructure
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Vision Agent Implementation
  - [ ] 5.1 Create the Vision Agent module (`agents/vision_agent.py`) with an async `analyze` method that accepts image_key and product metadata
    - _Requirements: 3.1, 3.6_
  - [ ] 5.2 Implement the Bedrock multimodal model invocation: retrieve image from S3, construct structured prompt requesting condition grade (A/B/C/D), confidence score (0-100), and explanation (max 150 words referencing visual attributes), parse JSON response
    - _Requirements: 3.1, 3.2, 9.1, 9.4_
  - [ ] 5.3 Add response validation and error handling: verify grade is valid enum, confidence is 0-100, explanation within word limit; fallback for malformed Bedrock responses
    - _Requirements: 3.3, 3.5_
  - [ ] 5.4 Add retry logic (3 attempts, exponential backoff: 1s, 2s, 4s) for transient Bedrock failures in the Vision Agent
    - _Requirements: 11.1_
  - [ ]* 5.5 Write property test for explanation length constraints
    - **Property 9: Explanation Length Constraints**
    - **Validates: Requirements 9.1, 9.2**

- [ ] 6. Valuation Agent Implementation
  - [ ] 6.1 Create the Valuation Agent module (`agents/valuation_agent.py`) with a `calculate` method that accepts condition_grade and product metadata (category, age_months, original_price)
    - _Requirements: 5.1, 5.2_
  - [ ] 6.2 Implement category-specific depreciation rates (Electronics: 2.5%, Clothing: 3.0%, Furniture: 1.0%, Books: 0.5%, Toys: 2.0%, Appliances: 1.5%, Sports Equipment: 1.8%) and condition multipliers (A=1.0, B=0.8, C=0.55, D=0.3)
    - _Requirements: 5.2, 5.4_
  - [ ] 6.3 Implement the resale value formula: `resale_value = original_price × (1 - monthly_rate × age_months) × condition_multiplier`, capping so value does not go below 0; compute range as min = value × 0.85, max = value × 1.15
    - _Requirements: 5.1, 5.3_
  - [ ] 6.4 Add edge case handling: display "No significant resale value" when calculated value < $1
    - _Requirements: 5.5_
  - [ ]* 6.5 Write property test for resale value depreciation formula
    - **Property 3: Resale Value Depreciation Formula**
    - **Validates: Requirements 5.1, 5.2, 5.4**
  - [ ]* 6.6 Write property test for resale value range invariant
    - **Property 4: Resale Value Range Invariant**
    - **Validates: Requirements 5.3**

- [ ] 7. Decision Agent Implementation
  - [ ] 7.1 Create the Decision Agent module (`agents/decision_agent.py`) with an async `decide` method that accepts condition_grade, valuation_result, and product metadata
    - _Requirements: 4.1_
  - [ ] 7.2 Implement deterministic rule-based action selection: "resell" (grade A/B, resale_value > 20% original), "refurbish" (grade B/C, refurb cost < 40% post-refurb value), "donate" (grade C/D, functional, low value), "recycle" (grade D, non-functional or value < 5% original)
    - _Requirements: 4.2, 4.3, 4.4, 4.5_
  - [ ] 7.3 Implement Bedrock text model call to generate action reasoning explanation (max 100 words) referencing condition grade, resale value, and product category
    - _Requirements: 4.6, 9.2, 9.5_
  - [ ]* 7.4 Write property test for action recommendation rules
    - **Property 5: Action Recommendation Rules**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [ ] 8. Sustainability Agent Implementation
  - [ ] 8.1 Create the Sustainability Agent module (`agents/sustainability_agent.py`) with a `calculate` method that accepts action_recommendation
    - _Requirements: 6.1, 7.3_
  - [ ] 8.2 Implement deterministic green credits calculation (resell=10, refurbish=15, donate=20, recycle=5) and CO2 savings (resell=2.5kg, refurbish=1.8kg, donate=1.5kg, recycle=0.8kg)
    - _Requirements: 6.2, 7.4_
  - [ ]* 8.3 Write property test for green credits formula
    - **Property 6: Green Credits Formula**
    - **Validates: Requirements 6.1, 6.2**
  - [ ]* 8.4 Write property test for CO2 savings calculation
    - **Property 7: CO2 Savings Calculation**
    - **Validates: Requirements 7.3, 7.4**

- [ ] 9. Buyer Matching Agent Implementation
  - [ ] 9.1 Create the Buyer Matching Agent module (`agents/buyer_matching_agent.py`) with an async `match` method that accepts product category, condition grade, and valuation result
    - _Requirements: 8.1, 8.2_
  - [ ] 9.2 Implement Bedrock text model call with prompt that generates up to 3 buyer personas, each with label, description, and relevance score (1-10), based on product category, condition, and resale value
    - _Requirements: 8.2, 8.3, 8.5_
  - [ ] 9.3 Implement conditional execution: only invoke when action_recommendation is "resell"; return None otherwise
    - _Requirements: 8.4_
  - [ ]* 9.4 Write property test for buyer persona conditional generation
    - **Property 8: Buyer Persona Conditional Generation**
    - **Validates: Requirements 8.3, 8.4**

- [ ] 10. Checkpoint - Verify all agents individually
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Assessment Orchestrator and API Endpoint
  - [ ] 11.1 Create the Assessment Orchestrator module (`services/assessment_orchestrator.py`) that coordinates the 5-agent pipeline in sequence: Vision → Valuation → Decision → Sustainability → Buyer Matching (conditional)
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 8.1_
  - [ ] 11.2 Create backend endpoint `POST /api/assess` that accepts image_key and product metadata, invokes the orchestrator pipeline, persists the complete assessment to the DynamoDB Assessments table, and returns the full assessment response
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 11.3_
  - [ ] 11.3 Create Pydantic request/response models matching the API contract (request: image_key, product_category, product_age_months, original_price; response: assessment_id, condition_grade, confidence_score, grade_explanation, action_recommendation, action_reasoning, resale_value object, green_credits, co2_savings_kg, buyer_personas)
    - _Requirements: 3.3, 4.6, 5.3, 6.5_
  - [ ] 11.4 Implement DynamoDB write for the assessment record and update UserMetrics aggregates (total_green_credits, total_co2_saved_kg, total_assessments, action_counts)
    - _Requirements: 6.3, 11.3_

- [ ] 12. Checkpoint - Verify full assessment pipeline end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Results View UI
  - [ ] 13.1 Create frontend Results View page with card layout: ConditionGradeCard (grade, confidence, explanation), ActionRecommendationCard (action, reasoning), ResaleValueCard (range display or "No significant resale value"), GreenCreditsCard (credits earned, CO2 saved)
    - _Requirements: 3.3, 4.6, 5.3, 6.5, 9.3_
  - [ ] 13.2 Create frontend BuyerPersonaList component that displays persona cards when available, or an informational message when recommendation is not "resell"
    - _Requirements: 8.3, 8.4_
  - [ ] 13.3 Implement color-coded condition grade indicators (A=green, B=blue, C=orange, D=red) and action recommendation icons
    - _Requirements: 3.3_
  - [ ] 13.4 Add loading state component shown while assessment is processing, with estimated wait time messaging
    - _Requirements: 3.4, 10.2_
  - [ ] 13.5 Add error state component with retry button that re-submits the assessment request
    - _Requirements: 3.5_

- [ ] 14. Sustainability Dashboard
  - [ ] 14.1 Create backend endpoint `GET /api/dashboard` that queries UserMetrics and recent Assessments from DynamoDB, returns total_green_credits, total_assessments, total_co2_saved_kg, action_distribution map, and recent assessments list
    - _Requirements: 7.1, 7.2_
  - [ ] 14.2 Create frontend Sustainability Dashboard page with summary metric cards (total credits, total assessments, total CO2 saved) and action distribution chart using Recharts
    - _Requirements: 7.1, 7.4, 7.6_
  - [ ] 14.3 Implement dashboard refresh after assessment completion (re-fetch on navigation) to reflect new metrics within 5 seconds
    - _Requirements: 7.5_

- [ ] 15. Frontend Routing, Navigation, and Polish
  - [ ] 15.1 Set up React Router with routes: home/upload page (/), results page (/results/:id), and dashboard (/dashboard)
    - _Requirements: 10.3_
  - [ ] 15.2 Create navigation bar component with links to Upload and Dashboard pages, displaying total Green_Credits badge
    - _Requirements: 6.4, 7.1_
  - [ ] 15.3 Implement session ID generation (UUID stored in localStorage) and include it as a header in all API requests for user identification
    - _Requirements: 7.2_
  - [ ] 15.4 Add responsive design breakpoints for tablet and mobile screen sizes using Tailwind responsive classes
    - _Requirements: 10.3_
  - [ ] 15.5 Add accessible labels, ARIA attributes, and keyboard navigation support to all interactive components
    - _Requirements: 10.3_

- [ ] 16. End-to-End Integration Wiring
  - [ ] 16.1 Wire all frontend components together: upload image → enter metadata → submit assessment → display results → navigate to dashboard with updated metrics
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.5_
  - [ ] 16.2 Create a demo-ready landing section with brief product description and "Get Started" call-to-action
    - _Requirements: 10.3_
  - [ ]* 16.3 Write property test for pre-signed URL expiry
    - **Property 10: Pre-signed URL Expiry**
    - **Validates: Requirements 12.2**

- [ ] 17. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- The design uses Python (FastAPI) for backend and React + Tailwind CSS for frontend
- The core assessment intelligence uses a 5-agent sequential pipeline: Vision → Valuation → Decision → Sustainability → Buyer Matching
- Vision Agent and Buyer Matching Agent call Amazon Bedrock (multimodal and text models respectively)
- Decision Agent uses deterministic rules for action selection + Bedrock text for reasoning generation
- Valuation Agent and Sustainability Agent are purely deterministic (no AI model calls)
- Image upload uses a simplified direct-to-backend pattern (`POST /api/upload` with multipart/form-data) for the MVP
- Tasks marked with `*` are optional property-based test tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical breakpoints
- No authentication is required for MVP (single-user session model for hackathon)
- Property-based tests use Hypothesis (Python) with minimum 100 examples per property

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "1.5", "1.6"] },
    { "id": 2, "tasks": ["2.1", "3.1", "3.3"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "3.2", "3.4"] },
    { "id": 4, "tasks": ["3.5", "5.1", "6.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "6.2", "6.3"] },
    { "id": 6, "tasks": ["5.4", "5.5", "6.4", "6.5", "6.6", "7.1"] },
    { "id": 7, "tasks": ["7.2", "7.3", "8.1"] },
    { "id": 8, "tasks": ["7.4", "8.2", "8.3", "8.4", "9.1"] },
    { "id": 9, "tasks": ["9.2", "9.3", "9.4"] },
    { "id": 10, "tasks": ["11.1"] },
    { "id": 11, "tasks": ["11.2", "11.3", "11.4"] },
    { "id": 12, "tasks": ["13.1", "13.2", "13.3", "13.4", "13.5", "14.1"] },
    { "id": 13, "tasks": ["14.2", "14.3", "15.1", "15.2", "15.3"] },
    { "id": 14, "tasks": ["15.4", "15.5", "16.1", "16.2", "16.3"] }
  ]
}
```
