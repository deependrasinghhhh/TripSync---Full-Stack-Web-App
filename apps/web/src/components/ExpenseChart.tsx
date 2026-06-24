import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { Expense } from "@/types";

interface ExpenseChartProps {
  expenses: Expense[];
}

const CATEGORY_COLORS: Record<string, string> = {
  ACCOMMODATION: "#8b5cf6",
  TRANSPORT: "#3b82f6",
  FOOD: "#f59e0b",
  ACTIVITIES: "#10b981",
  SHOPPING: "#ec4899",
  OTHER: "#6b7280",
};

const CATEGORY_LABELS: Record<string, string> = {
  ACCOMMODATION: "Accommodation",
  TRANSPORT: "Transport",
  FOOD: "Food & Dining",
  ACTIVITIES: "Activities",
  SHOPPING: "Shopping",
  OTHER: "Other",
};

export function ExpenseChart({ expenses }: ExpenseChartProps) {
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(categoryTotals).map(([category, total]) => ({
    name: CATEGORY_LABELS[category] || category,
    value: total,
    color: CATEGORY_COLORS[category] || "#6b7280",
  }));

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p className="text-sm">No expenses yet</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
            stroke="transparent"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} className="transition-opacity hover:opacity-80" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "hsl(224 71.4% 4.1%)",
              border: "1px solid hsl(215 27.9% 16.9%)",
              borderRadius: "0.75rem",
              padding: "8px 12px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
            itemStyle={{ color: "hsl(210 20% 98%)" }}
            formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            formatter={(value: string) => <span className="text-muted-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center">
        <p className="text-2xl font-bold">₹{total.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">Total Spent</p>
      </div>
    </div>
  );
}
