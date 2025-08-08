/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import api from "@/services/api"
import Link from "next/link"
import { Briefcase, TrendingUp, DollarSign, AlertTriangle, Package, BarChart3, FileText, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AiRecommendations } from "@/components/ai-recommendations"
import { useAuth } from "@/contexts/auth-context"

interface Product {
  nome: string
  quantidade_estoque: number
  lucro_unitario: string
  lucro_total?: string
}

export default function RelatoriosPage() {
  const { user, userId, loading: loadingUser } = useAuth()
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [mostProfitableProducts, setMostProfitableProducts] = useState<Product[]>([])
  const [stats, setStats] = useState({
    total_produtos: 0,
    produtos_estoque_baixo: 0,
  })
  const [businessMetrics, setBusinessMetrics] = useState({
    lucro_total: 0,
    lucro_unitario_medio: 0,
    ticket_medio: 0,
    total_itens: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Só buscar dados se o usuário estiver carregado e autenticado
    if (loadingUser || !userId) return

    const fetchData = async () => {
      try {
        const [dashboardRes, lucrativeRes] = await Promise.all([
          api.get("products/analysis/dashboard"),
          api.get("products/analysis/most-lucrative"),
        ])

        const dashboard = dashboardRes.data
        const lucrative = lucrativeRes.data

        setLowStockProducts(dashboard.produtos_estoque_baixo)
        setMostProfitableProducts(dashboard.produtos_mais_lucrativos)
        setStats(dashboard.estatisticas)

        const totalLucro = lucrative.reduce(
          (acc: number, p: { lucro_total: string }) => acc + Number.parseFloat(p.lucro_total),
          0,
        )

        const avgLucroUnit =
          lucrative.reduce(
            (acc: number, p: { lucro_unitario: string }) => acc + Number.parseFloat(p.lucro_unitario),
            0,
          ) / lucrative.length

        const totalItens = lucrative.reduce((acc: any, p: { quantidade_estoque: any }) => acc + p.quantidade_estoque, 0)
        const ticketMedio = totalItens ? totalLucro / totalItens : 0

        setBusinessMetrics({
          lucro_total: totalLucro,
          lucro_unitario_medio: avgLucroUnit,
          ticket_medio: ticketMedio,
          total_itens: totalItens,
        })
      } catch (err) {
        console.error("Erro ao buscar dados:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId, loadingUser])

  // Mostrar loading enquanto o usuário está sendo carregado
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Briefcase className="w-8 h-8 text-amber-600" />
            <h1 className="text-3xl font-bold text-gray-800">Sistema de Gestão</h1>
          </div>
          <p className="text-gray-600">Controle seu negócio de forma simples e inteligente</p>
          {user && (
            <p className="text-sm text-gray-500">
              Relatórios para: <strong>{user.nome}</strong>
            </p>
          )}
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
              <Package className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_produtos}</div>
              <p className="text-xs text-slate-200">Estoque total</p>
            </CardContent>
          </Card>

          <Card className="bg-teal-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Estimado</CardTitle>
              <TrendingUp className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {businessMetrics.lucro_total.toFixed(2)}</div>
              <p className="text-xs text-teal-200">Baseado nos produtos mais lucrativos</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <DollarSign className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {businessMetrics.ticket_medio.toFixed(2)}</div>
              <p className="text-xs text-yellow-200">Estimado por item</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas</CardTitle>
              <AlertTriangle className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.produtos_estoque_baixo}</div>
              <p className="text-xs text-red-200">Produtos com estoque baixo</p>
            </CardContent>
          </Card>
        </div>

        {/* Estoque baixo */}
        {lowStockProducts.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Atenção: Estoque Baixo</strong>
              <div className="mt-2 space-y-1">
                {lowStockProducts.map((product, index) => (
                  <div key={index} className="flex justify-between items-center gap-8">
                    <span>{product.nome}</span>
                    <Badge variant="destructive">{product.quantidade_estoque} restantes</Badge>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Navegação */}
        <div className="flex gap-1 bg-white p-1 rounded-lg border">
          <Link href="/inventory">
            <Button variant="ghost" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Estoque
            </Button>
          </Link>
          <Link href="/finances">
            <Button variant="ghost" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Financeiro
            </Button>
          </Link>
          <Link href="/graphics">
            <Button variant="ghost" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Gráficos
            </Button>
          </Link>
          <Button className="flex items-center gap-2 bg-slate-600 text-white">
            <FileText className="w-4 h-4" />
            Relatórios
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <AiRecommendations />

         
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Análise de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Produtos mais lucrativos:</h4>
                <div className="space-y-3">
                  {mostProfitableProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-800">{product.nome}</span>
                      <Badge className="bg-teal-600 text-white hover:bg-teal-700">
                        R$ {product.lucro_unitario} lucro/unidade
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas do negócio */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas do Negócio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-100 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-gray-800">
                  {businessMetrics.lucro_unitario_medio.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Lucro Médio por Produto</div>
              </div>
              <div className="bg-gray-100 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-gray-800">R$ {businessMetrics.ticket_medio.toFixed(2)}</div>
                <div className="text-sm text-gray-600 mt-1">Ticket Médio</div>
              </div>
              <div className="bg-gray-100 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-gray-800">{businessMetrics.total_itens}</div>
                <div className="text-sm text-gray-600 mt-1">Itens Estocados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
