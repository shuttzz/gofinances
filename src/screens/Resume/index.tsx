import React, { useCallback, useEffect, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { VictoryPie } from 'victory-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from 'styled-components/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
// eslint-disable-next-line import/no-duplicates
import { addMonths, format, subMonths } from 'date-fns';
// eslint-disable-next-line import/no-duplicates
import { ptBR } from 'date-fns/locale';

import { ActivityIndicator } from 'react-native';
import * as S from './styles';
import { HistoryCard } from '../../components/HistoryCard';
import { DataListProps } from '../Dashboard';
import { categories } from '../../utils/categories';
import { useAuth } from '../../hooks/useAuth';

interface TotalByCategory {
  name: string;
  total: number;
  totalFormated: string;
  color: string;
  percentFormated: string;
  percent: number;
}

export function Resume() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDateFilter, setSelectedDateFilter] = useState(new Date());
  const [totalByCategories, setTotalByCategories] = useState<TotalByCategory[]>(
    []
  );
  const { user } = useAuth();

  const barHeight = useBottomTabBarHeight();

  const theme = useTheme();

  const handleDateFilterChange = (action: 'next' | 'prev') => {
    setIsLoading(true);
    if (action === 'next') {
      setSelectedDateFilter(addMonths(selectedDateFilter, 1));
    } else {
      setSelectedDateFilter(subMonths(selectedDateFilter, 1));
    }
  };

  const loadData = async () => {
    const dataKey = `@gofinances:transactions_user:${user.id}`;
    const responseInString = await AsyncStorage.getItem(dataKey);
    const responseFormated = responseInString
      ? JSON.parse(responseInString)
      : [];

    const expensives = responseFormated.filter(
      (expensive: DataListProps) =>
        expensive.type === 'negative' &&
        new Date(expensive.date).getMonth() === selectedDateFilter.getMonth() &&
        new Date(expensive.date).getFullYear() ===
          selectedDateFilter.getFullYear()
    );

    const expensiveTotal = expensives.reduce(
      (accumulator: number, expensive: DataListProps) =>
        accumulator + Number(expensive.amount),
      0
    );

    const totalByCategory: TotalByCategory[] = [];

    categories.forEach((categoryItem) => {
      let categorySum = 0;

      expensives.forEach((expensiveItem: DataListProps) => {
        if (expensiveItem.category === categoryItem.key) {
          categorySum += Number(expensiveItem.amount);
        }
      });

      if (categorySum > 0) {
        const totalFormated = categorySum.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });

        const percent = (categorySum / expensiveTotal) * 100;
        const percentFormated = `${percent.toFixed(0)}%`;

        totalByCategory.push({
          name: categoryItem.name,
          total: categorySum,
          totalFormated,
          color: categoryItem.color,
          percent,
          percentFormated
        });
      }
    });

    setTotalByCategories(totalByCategory);
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedDateFilter])
  );

  return (
    <S.Container>
      <S.Header>
        <S.Title>Resumo por categoria</S.Title>
      </S.Header>
      {isLoading ? (
        <S.LoadContainer>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </S.LoadContainer>
      ) : (
        <S.ContainerList
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 24,
            paddingBottom: barHeight
          }}
        >
          <S.MonthSelect>
            <S.MonthSelectButton onPress={() => handleDateFilterChange('prev')}>
              <S.MonthSelectIcon name="chevron-left" />
            </S.MonthSelectButton>

            <S.Month>
              {format(selectedDateFilter, 'MMMM, yyyy', { locale: ptBR })}
            </S.Month>

            <S.MonthSelectButton onPress={() => handleDateFilterChange('next')}>
              <S.MonthSelectIcon name="chevron-right" />
            </S.MonthSelectButton>
          </S.MonthSelect>
          <S.ChartContainer>
            <VictoryPie
              data={totalByCategories}
              colorScale={totalByCategories.map((category) => category.color)}
              style={{
                labels: {
                  fontSize: RFValue(18),
                  fontWeight: 'bold'
                  // fill: theme.colors.shape // Utilizo esse fill para poder mudar a cor do texto
                }
              }}
              labelRadius={150} // Movimenta o Label para ficar dentro ou fora, com 50 ele fica dentro do gráfico
              x="percentFormated"
              y="total"
            />
          </S.ChartContainer>

          {totalByCategories.map((item) => (
            <HistoryCard
              key={item.name}
              title={item.name}
              amount={item.totalFormated}
              color={item.color}
            />
          ))}
        </S.ContainerList>
      )}
    </S.Container>
  );
}
