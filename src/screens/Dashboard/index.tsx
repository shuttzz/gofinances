import React, { useCallback, useEffect, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from 'styled-components/native';
import { ActivityIndicator, Platform } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

import { HighlightCard } from '../../components/HighlightCard';
import {
  TransactionCard,
  TransactionCardProps
} from '../../components/TransactionCard';

import * as S from './styles';

export interface DataListProps extends TransactionCardProps {
  id: string;
}

type HighlightProps = {
  total: string;
  lastTransaction: string;
};

interface HighlightData {
  entries: HighlightProps;
  expensives: HighlightProps;
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<DataListProps[]>(
    [] as DataListProps[]
  );
  const [highlightData, setHighlightData] = useState<HighlightData>(
    {} as HighlightData
  );
  const [diference, setDiference] = useState('');
  const [lastIntervalTotal, setLastIntervalTotal] = useState('');
  const [userNameShort, setUserNameShort] = useState('');
  const { signOut, user } = useAuth();

  const theme = useTheme();

  const getLastTransactionDateFormated = (
    collection: DataListProps[],
    type: 'positive' | 'negative'
  ): string => {
    try {
      const collectionFilttered = collection.filter(
        (transaction) => transaction.type === type
      );

      if (collectionFilttered.length === 0) {
        return '0';
      }

      const lastTransactionDate = new Date(
        // eslint-disable-next-line prefer-spread
        Math.max.apply(
          Math,
          collectionFilttered.map((transaction) =>
            new Date(transaction.date).getTime()
          )
        )
      );

      return `${lastTransactionDate.getDate()} de ${lastTransactionDate.toLocaleString(
        'pt-BR',
        { month: 'long' }
      )} de ${lastTransactionDate.getFullYear()}`;
    } catch (err) {
      return 'NO-RESULT';
    }
  };

  const loadTransactions = async () => {
    const dataKey = `@gofinances:transactions_user:${user.id}`;
    const response = await AsyncStorage.getItem(dataKey);

    const transactionsParsed = response ? JSON.parse(response) : [];

    let entriesTotal = 0;
    let expensiveTotal = 0;

    const transactionsFormated: DataListProps[] = transactionsParsed.map(
      (item: DataListProps) => {
        if (item.type === 'positive') {
          entriesTotal += Number(item.amount);
        } else {
          expensiveTotal += Number(item.amount);
        }

        const amount = Number(item.amount).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });

        let date;

        if (Platform.OS === 'ios') {
          date = new Date(item.date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          });
        } else {
          date = Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }).format(new Date(item.date));
        }

        return {
          ...item,
          category: item.category,
          amount,
          date
        };
      }
    );

    setTransactions(transactionsFormated);

    const lastTransactionDateEntrieFormatted = getLastTransactionDateFormated(
      transactionsParsed,
      'positive'
    );

    const lastTransactionDateExpensiveFormatted = getLastTransactionDateFormated(
      transactionsParsed,
      'negative'
    );

    if (lastTransactionDateEntrieFormatted === '0') {
      setLastIntervalTotal(`01 a ${new Date().getDate()}`);
    } else {
      setLastIntervalTotal(`01 a ${lastTransactionDateEntrieFormatted}`);
    }

    const diference = (entriesTotal - expensiveTotal).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    setHighlightData({
      entries: {
        total: entriesTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction:
          lastTransactionDateEntrieFormatted === '0'
            ? 'Não há transações'
            : `Última entrada dia ${lastTransactionDateEntrieFormatted}`
      },
      expensives: {
        total: expensiveTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction:
          lastTransactionDateExpensiveFormatted === '0'
            ? 'Não há transações'
            : `Última saída dia ${lastTransactionDateExpensiveFormatted}`
      }
    });

    setDiference(diference);
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  useEffect(() => {
    const firstName = user.name.split(' ');
    setUserNameShort(firstName[0]);
  }, [user.name]);

  return (
    <S.Container>
      {isLoading ? (
        <S.LoadContainer>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </S.LoadContainer>
      ) : (
        <>
          <S.Header>
            <S.UserWrapper>
              <S.UserInfo>
                <S.Photo
                  source={{
                    uri: user.photo
                  }}
                />

                <S.User>
                  <S.UserGreeting>Olá,</S.UserGreeting>
                  <S.UserName>{userNameShort}</S.UserName>
                </S.User>
              </S.UserInfo>

              <S.LogoutButton onPress={signOut}>
                <S.Icon name="power" />
              </S.LogoutButton>
            </S.UserWrapper>
          </S.Header>

          <S.HighlightCards>
            <HighlightCard
              type="up"
              title="Entradas"
              amount={highlightData.entries.total}
              lastTransaction={highlightData.entries.lastTransaction}
            />
            <HighlightCard
              type="down"
              title="Saídas"
              amount={highlightData.expensives.total}
              lastTransaction={highlightData.expensives.lastTransaction}
            />
            <HighlightCard
              type="total"
              title="Total"
              amount={diference}
              lastTransaction={lastIntervalTotal}
            />
          </S.HighlightCards>

          <S.Transactions>
            <S.Title>Listagem</S.Title>

            <S.TransactionList
              data={transactions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <TransactionCard data={item} />}
            />
          </S.Transactions>
        </>
      )}
    </S.Container>
  );
}
