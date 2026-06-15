.PHONY: frontend backend dev install-frontend install-backend install

# Run frontend dev server
frontend:
	cd frontend && npm run dev

# Run backend dev server
backend:
	cd backend && uv run uvicorn main:app --reload

# Run both frontend and backend
dev:
	$(MAKE) backend & $(MAKE) frontend & wait

# Install dependencies
install-frontend:
	cd frontend && npm install

install-backend:
	cd backend && uv sync

install: install-frontend install-backend
