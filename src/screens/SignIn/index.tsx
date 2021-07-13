import React, { useState } from 'react';

import { RFValue } from 'react-native-responsive-fontsize';
import { ActivityIndicator, Alert, Platform } from 'react-native';
import { useTheme } from 'styled-components/native';
import * as S from './styles';

import AppleSvg from '../../assets/apple.svg';
import GoogleSvg from '../../assets/google.svg';
import LogoSvg from '../../assets/logo.svg';
import { SigInSocialButton } from '../../components/SigInSocialButton';
import { useAuth } from '../../hooks/useAuth';

export function SignIn() {
  const [isLoading, setIsLoading] = useState(false);

  const theme = useTheme();

  const { signInWithGoogle, signInWithApple } = useAuth();

  const handleSignInWithGoogle = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (err) {
      Alert.alert(
        'Erro ao realizar login',
        'Não foi possível conectar a conta Google'
      );
      setIsLoading(false);
    }
  };

  const handleSignInWithApple = async () => {
    try {
      setIsLoading(true);
      await signInWithApple();
    } catch (err) {
      Alert.alert(
        'Erro ao realizar login',
        'Não foi possível conectar a conta Apple'
      );
      setIsLoading(false);
    }
  };

  return (
    <S.Container>
      <S.Header>
        <S.TitleWrapper>
          <LogoSvg width={RFValue(120)} height={RFValue(68)} />

          <S.Title>
            Controle suas{'\n'}finanças de forma{'\n'}muito simples
          </S.Title>
        </S.TitleWrapper>

        <S.SignInTitle>
          Faça seu login com{'\n'}uma das contas abaixo
        </S.SignInTitle>
      </S.Header>

      <S.Footer>
        <S.FooteWrapper>
          <SigInSocialButton
            title="Entrar com Google"
            svg={GoogleSvg}
            onPress={handleSignInWithGoogle}
          />

          {Platform.OS === 'ios' && (
            <SigInSocialButton
              title="Entrar com Apple"
              svg={AppleSvg}
              onPress={handleSignInWithApple}
            />
          )}
        </S.FooteWrapper>

        {isLoading && (
          <ActivityIndicator
            style={{ marginTop: RFValue(16) }}
            color={theme.colors.shape}
            size="large"
          />
        )}
      </S.Footer>
    </S.Container>
  );
}
