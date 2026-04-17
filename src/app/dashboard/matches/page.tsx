"use client";

import { useState } from "react";
import {
  Bell, Search, Clock, DollarSign, CheckSquare, Users, Shield,
  Flag, RotateCcw, Heart, ChevronDown, X, Lock, RefreshCw,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type CredibilityLevel = "low" | "medium" | "high" | "verified";
type SidebarItem = "matches" | "recommendations" | "picked" | "started" | "submitted" | "ignored";

interface Scholarship {
  id: string;
  name: string;
  requirements: string;
  amount: string;
  amountLabel: string;
  deadline: string;
  deadlineLabel: string;
  reqCount?: number;
  reqCountLabel?: string;
  applicants?: number;
  applicantsLabel?: string;
  credibility: number;
  credibilityLevel: CredibilityLevel;
  recurring: boolean;
  tags: string[];
  isProApplicants?: boolean;
}

// ── Sample data ────────────────────────────────────────────────────────────

const SCHOLARSHIPS: Scholarship[] = [
  {
    id: "1",
    name: "Game Designer Student Scholarship",
    requirements: "5 requirements: 2 Essays, Video, 2 Documents",
    amount: "$5,000",
    amountLabel: "Amount",
    deadline: "in 29 days",
    deadlineLabel: "Deadline",
    reqCount: 5,
    reqCountLabel: "Requirements",
    applicants: undefined,
    credibility: 83,
    credibilityLevel: "high",
    recurring: true,
    tags: ["Healthcare"],
  },
  {
    id: "2",
    name: "Regent Restoration COVID-19 Financial Relief Giveaway",
    requirements: "3 requirements: Essay, Video, Document",
    amount: "$1,000",
    amountLabel: "Amount",
    deadline: "in 5 days",
    deadlineLabel: "Deadline",
    credibility: 55,
    credibilityLevel: "medium",
    recurring: true,
    tags: ["Healthcare", "Art"],
  },
  {
    id: "3",
    name: "You Deserve It Scholarship",
    requirements: "No requirements",
    amount: "$2,222",
    amountLabel: "Amount",
    deadline: "in 1 month",
    deadlineLabel: "Deadline",
    credibility: 99,
    credibilityLevel: "verified",
    recurring: true,
    tags: ["Education"],
  },
  {
    id: "4",
    name: "Health Professionals Scholarship",
    requirements: "2 requirements: Video, Document",
    amount: "$2,000",
    amountLabel: "Multiple awards",
    deadline: "in 3 months",
    deadlineLabel: "Deadline",
    reqCount: 3,
    reqCountLabel: "Requirements",
    applicants: 124,
    applicantsLabel: "Applicants",
    credibility: 42,
    credibilityLevel: "low",
    recurring: true,
    tags: ["Healthcare"],
  },
  {
    id: "5",
    name: "Future STEM Leaders Award",
    requirements: "4 requirements: 2 Essays, Transcript, Reference Letter",
    amount: "$10,000",
    amountLabel: "Amount",
    deadline: "in 45 days",
    deadlineLabel: "Deadline",
    reqCount: 4,
    reqCountLabel: "Requirements",
    applicants: 87,
    applicantsLabel: "Applicants",
    credibility: 78,
    credibilityLevel: "high",
    recurring: false,
    tags: ["STEM", "Engineering"],
    isProApplicants: true,
  },
  {
    id: "6",
    name: "Commonwealth Graduate Excellence Grant",
    requirements: "3 requirements: Research Proposal, CV, References",
    amount: "$15,000",
    amountLabel: "Full funding",
    deadline: "in 60 days",
    deadlineLabel: "Deadline",
    reqCount: 3,
    reqCountLabel: "Requirements",
    applicants: 312,
    applicantsLabel: "Applicants",
    credibility: 95,
    credibilityLevel: "verified",
    recurring: true,
    tags: ["Graduate", "International"],
  },
];
